import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

export class ArousalManager {
    constructor() {
        this.bodyParts = ['breasts', 'nipples', 'vagina', 'clitoris', 'g-spot', 'anal', 'penis', 'prostate'];
        this.partValues = {
            'breasts': 1,
            'nipples': 2,
            'vagina': 8,
            'clitoris': 10,
            'g-spot': 12,
            'anal': 4,
            'penis': 10,
            'prostate': 12
        };
        this.character = null;
        this.state = {
            activeParts: {},
            arousal: 0,
            orgasmCount: 0
        };
    }

    setCharacter(character) {
        if (!character || character.name === this.character?.name) return;
        this.character = character;
        this.loadState();
    }

    getVarName(key) {
        if (!this.character) return null;
        return `arousal_${this.character.name.replace(/\s+/g, '_')}_${key}`;
    }

    getGlobalVariable(key, asString = false) {
        const varName = this.getVarName(key);
        if (!varName) return asString ? '' : 0;
        
        if (extension_settings.variables?.global?.[varName] !== undefined) {
            return asString ? 
                String(extension_settings.variables.global[varName]) : 
                parseFloat(extension_settings.variables.global[varName]);
        }
        
        return asString ? '' : 0;
    }
    
    setGlobalVariable(key, value) {
        const varName = this.getVarName(key);
        if (!varName) return;
        
        if (!extension_settings.variables) {
            extension_settings.variables = { global: {} };
        }
        
        extension_settings.variables.global[varName] = value;
        saveSettingsDebounced();
    }

    loadState() {
        if (!this.character) return;
        
        // Load active parts
        const activePartsJSON = this.getGlobalVariable('activeParts', true);
        try {
            this.state.activeParts = activePartsJSON ? JSON.parse(activePartsJSON) : {};
        } catch {
            this.state.activeParts = {};
        }
        
        // Load other state values
        this.state.arousal = parseFloat(this.getGlobalVariable('arousal')) || 0;
        this.state.orgasmCount = parseInt(this.getGlobalVariable('orgasm_count')) || 0;
        
        // Clamp arousal between 0-100
        if (this.state.arousal < 0) this.state.arousal = 0;
        if (this.state.arousal > 100) this.state.arousal = 100;
    }
    
    saveState() {
        if (!this.character) return;
        
        this.setGlobalVariable('activeParts', JSON.stringify(this.state.activeParts));
        this.setGlobalVariable('arousal', this.state.arousal);
        this.setGlobalVariable('orgasm_count', this.state.orgasmCount);
    }
    
    togglePart(part) {
        if (!this.bodyParts.includes(part)) return;
        
        if (!this.state.activeParts[part]) {
            this.state.activeParts[part] = true;
        } else {
            delete this.state.activeParts[part];
        }
        
        this.saveState();
    }
    
    processAroual() {
        if (!this.character) return null;
        
        let result = null;
        
        // Calculate arousal gain from active parts
        let baseGain = 0;
        for (const part in this.state.activeParts) {
            baseGain += this.partValues[part];
        }
        
        // Apply diminishing returns based on current arousal
        let actualGain = baseGain;
        if (this.state.arousal >= 70) {
            actualGain *= 0.6;
        } else if (this.state.arousal >= 30) {
            actualGain *= 0.8;
        }
        
        // If no parts active - decrease arousal
        if (baseGain === 0 && this.state.arousal > 0) {
            this.state.arousal = Math.max(0, this.state.arousal - 5);
            this.saveState();
            return null;
        }
        
        const prevArousal = this.state.arousal;
        this.state.arousal += actualGain;
        
        // Generate event messages if reached threshold
        if (prevArousal < 80 && this.state.arousal >= 80) {
            result = this.generateHighArousalMessage();
        }
        
        // Check for orgasm
        if (this.state.arousal >= 100) {
            result = this.processOrgasm();
        }
        
        // Clamp arousal to max 100
        if (this.state.arousal > 100) {
            this.state.arousal = 100;
        }
        
        this.saveState();
        return result;
    }
    
    generateHighArousalMessage() {
        const parts = Object.keys(this.state.activeParts);
        const hasInternal = parts.includes('g-spot') || parts.includes('vagina') || parts.includes('prostate');
        
        let message = `${this.character.name} is close to having an orgasm!`;
        
        if (hasInternal) {
            message += ` Their internal muscles coil and clench as they feel themselves getting close!`;
        } else {
            message += ` Their body trembles with anticipation.`;
        }
        
        return `[Arousal System] ${message}`;
    }
    
    processOrgasm() {
        // Reset arousal with chance for multi-orgasm
        let newArousal;
        let isMultiOrgasm = false;
        let isSquirting = false;
        let isProstateOrgasm = false;
        let isPenisOrgasm = false;
        
        // Determine orgasm type
        if (this.state.activeParts['prostate'] && !this.state.activeParts['penis']) {
            isProstateOrgasm = true;
            isMultiOrgasm = Math.random() < 1.0; // Always multi until limit
        } else if (this.state.activeParts['penis']) {
            isPenisOrgasm = true;
            isMultiOrgasm = Math.random() < 0.0; // Never multi
        } else if (this.state.activeParts['g-spot']) {
            isSquirting = Math.random() < 0.7;
            isMultiOrgasm = Math.random() < 0.6;
        } else {
            isMultiOrgasm = Math.random() < 0.3;
        }
        
        // Handle multi-orgasms or reset
        if (isMultiOrgasm && this.state.orgasmCount < 5) {
            newArousal = 80;
            this.state.orgasmCount++;
        } else {
            newArousal = isProstateOrgasm ? 0 : 20;
            this.state.orgasmCount = 0;
        }
        
        // Handle reaching orgasm limit
        if (this.state.orgasmCount >= 5) {
            newArousal = 0; // Exhausted
            this.state.orgasmCount = 0;
        }
        
        // Generate orgasm message based on type and intensity
        let message = this.generateOrgasmMessage(isSquirting, isProstateOrgasm, isPenisOrgasm);
        
        this.state.arousal = newArousal;
        this.saveState();
        
        return `[Arousal System] ${message}`;
    }
    
    generateOrgasmMessage(isSquirting, isProstateOrgasm, isPenisOrgasm) {
        const intensity = this.state.orgasmCount;
        const intensityWords = [
            "", 
            "intense ", 
            "powerful ", 
            "overwhelming ", 
            "mind-shattering ",
            "unconscious "
        ];
        
        let description = `${this.character.name} is having `;
        
        if (isProstateOrgasm) {
            if (intensity >= 5) {
                description = `${this.character.name} collapses unconscious from ${intensityWords[intensity]}pleasure after multiple prostate orgasms!`;
            } else if (intensity === 0) {
                description = `${this.character.name} has a prostate orgasm! Their body quivers as their cock leaks clear fluid.`;
            } else {
                description = `${this.character.name} has ${intensityWords[intensity]}prostate orgasm #${intensity+1}! `;
                
                if (intensity === 1) {
                    description += `Their prostate pulses intensely, leaking more precum!`;
                } else if (intensity === 2) {
                    description += `Their penis twitches violently, spraying thin streams of precum!`;
                } else if (intensity === 3) {
                    description += `Their whole body shakes uncontrollably as pleasure overwhelms them!`;
                } else if (intensity === 4) {
                    description += `They scream out as ecstasy consumes their entire body!`;
                }
            }
        } 
        else if (isPenisOrgasm) {
            description = `${this.character.name} has a penis orgasm! Their member pulses and sprays thick ropes of semen!`;
        } 
        else if (isSquirting) {
            if (intensity >= 5) {
                description = `${this.character.name} collapses unconscious after multiple squirting orgasms!`;
            } else if (intensity === 0) {
                description = `${this.character.name} has a ${intensityWords[intensity]}squirting orgasm! Fluid jets out in a powerful arc!`;
            } else {
                description = `${this.character.name} has ${intensityWords[intensity]}squirting orgasm #${intensity+1}! `;
                
                if (intensity === 1) {
                    description += `Their vaginal walls ripple as more fluid gushes out!`;
                } else if (intensity === 2) {
                    description += `Their legs shake uncontrollably as pleasure courses through them!`;
                } else if (intensity === 3) {
                    description += `Their core muscles contract violently, spraying fluid!`;
                } else if (intensity === 4) {
                    description += `Their vision goes white as ecstasy overwhelms them!`;
                }
            }
        } 
        else {
            if (intensity >= 5) {
                description = `${this.character.name} passes out from relentless orgasms!`;
            } else {
                description = `${this.character.name} has ${intensityWords[intensity]}orgasm! Their body convulses rhythmically.`;
            }
        }
        
        return description;
    }
}
