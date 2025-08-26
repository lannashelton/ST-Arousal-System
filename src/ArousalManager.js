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
        this.speedLevels = {
            'slow': 0.5,
            'normal': 1.0,
            'fast': 2.0
        };
        this.character = null;
        this.state = {
            activeParts: {},
            arousal: 0,
            orgasmCount: 0,
            speed: 'normal'
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
        this.state.speed = this.getGlobalVariable('speed', true) || 'normal';
        
        // Clamp arousal between 0-100
        if (this.state.arousal < 0) this.state.arousal = 0;
        if (this.state.arousal > 100) this.state.arousal = 100;
    }
    
    saveState() {
        if (!this.character) return;
        
        this.setGlobalVariable('activeParts', JSON.stringify(this.state.activeParts));
        this.setGlobalVariable('arousal', this.state.arousal);
        this.setGlobalVariable('orgasm_count', this.state.orgasmCount);
        this.setGlobalVariable('speed', this.state.speed); // Save speed
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
        
        // Apply speed multiplier
        baseGain *= this.speedLevels[this.state.speed];
        
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

    setSpeed(speed) {
        if (!this.speedLevels[speed]) return;
        this.state.speed = speed;
        this.saveState();
        return `Speed set to ${speed} (${this.speedLevels[speed]}x)`;
    }
    
    generateHighArousalMessage() {
        const parts = Object.keys(this.state.activeParts);
        const hasDeepStimulation = parts.includes('g-spot') || 
                                  parts.includes('vagina') || 
                                  parts.includes('prostate');
        
        let message = `${this.character.name} is close to having an orgasm!`;
        
        if (hasDeepStimulation) {
            message += ` Their internal muscles coil and clench as they feel themselves getting close!`;
        } else {
            message += ` Their body trembles with anticipation.`;
        }
        
        return `[Arousal System] ${message}`;
    }

    getOrgasmType() {
        const parts = Object.keys(this.state.activeParts);
        const priority = [
            'penis', 'g-spot', 'prostate', 'vagina', 'clitoris'
        ];
        
        // Find the highest priority active stimulation type
        for (const type of priority) {
            if (parts.includes(type)) {
                return type;
            }
        }
        
        // If none found, it's a generic orgasm
        return 'generic';
    }
    
    processOrgasm() {
        const orgasmType = this.getOrgasmType();
        
        // Reset arousal with chance for multi-orgasm
        let newArousal;
        let isMultiOrgasm = false;
        let message = '';
        const intensity = this.state.orgasmCount + 1;
        const intensityWords = ['', 'second', 'third', 'fourth', 'fifth'];
        
        // Handle different orgasm types
        switch(orgasmType) {
            case 'penis':
                newArousal = 0;
                if (intensity === 1) {
                    message = `${this.character.name} has a penile orgasm! Their member pulses and sprays thick ropes of semen!`;
                } else if (intensity === 5) {
                    message = `${this.character.name} has their ${intensityWords[intensity-1]} explosive orgasm! They collapse from overwhelming pleasure!`;
                    newArousal = 0;
                    this.state.orgasmCount = 0;
                } else {
                    message = `${this.character.name} has another penile orgasm! More cum spurts out as they convulse!`;
                    this.state.orgasmCount++; // Special case for multiple penile orgasms
                }
                break;
                
            case 'g-spot':
                isMultiOrgasm = Math.random() < 0.6;
                newArousal = isMultiOrgasm ? 80 : 20;
                message = this.getGspotMessage(intensity);
                break;
                
            case 'prostate':
                isMultiOrgasm = Math.random() < 1.0;
                newArousal = isMultiOrgasm ? 80 : 0;
                message = this.getProstateMessage(intensity);
                break;
                
            case 'vagina':
                isMultiOrgasm = Math.random() < 0.3;
                newArousal = isMultiOrgasm ? 80 : 50;
                if (intensity === 1) {
                    message = `${this.character.name} has a powerful vaginal orgasm! Their pelvic muscles contract rhythmically!`;
                } else if (intensity === 5) {
                    message = `${this.character.name} has their ${intensityWords[intensity-1]} intense orgasm! They collapse from the overwhelming pleasure!`;
                    newArousal = 0;
                    this.state.orgasmCount = 0;
                } else {
                    message = `${this.character.name} has another vaginal orgasm! Powerful contractions wrack their body!`;
                }
                break;
                
            case 'clitoris':
                newArousal = 30;
                if (intensity === 1) {
                    message = `${this.character.name} has a clitoral orgasm! Sharp bursts of pleasure radiate from their sensitive nub!`;
                } else if (intensity === 5) {
                    message = `${this.character.name} has their ${intensityWords[intensity-1]} intense orgasm! They collapse from the overwhelming pleasure!`;
                    newArousal = 0;
                    this.state.orgasmCount = 0;
                } else {
                    message = `${this.character.name} has another clitoral orgasm! Waves of pleasure shoot through their body!`;
                }
                break;
                
            default: // Generic orgasm
                isMultiOrgasm = Math.random() < 0.1;
                newArousal = isMultiOrgasm ? 80 : 20;
                if (intensity === 1) {
                    message = `${this.character.name} has an orgasm! Their pelvic muscles contract rhythmically!`;
                } else if (intensity === 5) {
                    message = `${this.character.name} has their ${intensityWords[intensity-1]} intense orgasm! They collapse from exhaustion!`;
                    newArousal = 0;
                    this.state.orgasmCount = 0;
                } else {
                    message = `${this.character.name} has another orgasm! Another wave of pleasure runs through their body!`;
                }
        }
        
        // Handle multi-orgasms
        if (isMultiOrgasm && newArousal > 0) {
            if (intensity < 5) {
                this.state.orgasmCount++;
            } else {
                // Fifth orgasm - always reset
                newArousal = 0;
                this.state.orgasmCount = 0;
            }
        } else {
            this.state.orgasmCount = 0;
        }
        
        this.state.arousal = newArousal;
        this.saveState();
        
        return `[Arousal System] ${message}`;
    }
    
    getGspotMessage(intensity) {
        const intensityWords = ['', 'intense', 'powerful', 'overwhelming', 'mind-shattering', 'ultimate'];
        const character = this.character.name;
        let action = "";
        
        switch(intensity) {
            case 1:
                action = "Their vaginal walls ripple as fluid gushes out!";
                break;
            case 2:
                action = "Their legs shake uncontrollably as pleasure courses through them!";
                break;
            case 3:
                action = "They cry out as intense waves of pleasure overwhelm them!";
                break;
            case 4:
                action = "The ground becomes slick with their fluids as convulsions wrack their body!";
                break;
            case 5:
                action = "They collapse unconscious from ecstasy as the final orgasm tears through them!";
                break;
        }
        
        if (intensity === 1) {
            return `${character} has a squirting orgasm! ${action}`;
        } else if (intensity === 5) {
            return `${character} has the ${intensityWords[intensity-1]} squirting orgasm! ${action}`;
        } else {
            return `${character} has an ${intensityWords[intensity-1]} squirting orgasm (#${intensity})! ${action}`;
        }
    }
    
    getProstateMessage(intensity) {
        const intensityWords = ['', 'deep', 'powerful', 'overwhelming', 'mind-shattering', 'ultimate'];
        const character = this.character.name;
        let action = "";
        
        switch(intensity) {
            case 1:
                action = "Clear precum streams from their cock as their prostate convulses!";
                break;
            case 2:
                action = "Thin streams of precum spray as their pelvic muscles contract rhythmically!";
                break;
            case 3:
                action = "Their whole torso trembles as pleasure overloads their senses!";
                break;
            case 4:
                action = "They gasp and thrash as wave after wave of ecstasy crashes over them!";
                break;
            case 5:
                action = "They pass out from sensory overload as the final orgasm tears through them!";
                break;
        }
        
        if (intensity === 1) {
            return `${character} has a prostate orgasm! ${action}`;
        } else if (intensity === 5) {
            return `${character} has the ${intensityWords[intensity-1]} prostate orgasm! ${action}`;
        } else {
            return `${character} has a ${intensityWords[intensity-1]} prostate orgasm (#${intensity})! ${action}`;
        }
    }
}
