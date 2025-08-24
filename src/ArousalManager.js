import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

export class ArousalManager {
    constructor() {
        this.bodyParts = ['breasts', 'nipples', 'vagina', 'clitoris', 'g-spot', 'anal'];
        this.partValues = {
            'breasts': 1,
            'nipples': 2,
            'vagina': 8,
            'clitoris': 10,
            'g-spot': 12,
            'anal': 4
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
        const hasInternal = parts.includes('g-spot') || parts.includes('vagina');
        
        let message = `${this.character.name} is close to having an orgasm!`;
        
        if (hasInternal) {
            message += ` Her vaginal muscles coil and clench as she feels herself getting close!`;
        } else {
            message += ` Her body trembles with anticipation.`;
        }
        
        return `[Arousal System] ${message}`;
    }
    
    processOrgasm() {
        // Reset arousal with chance for multi-orgasm
        let newArousal;
        let isMultiOrgasm = false;
        let isSquirting = false;
        
        const multiChance = Object.keys(this.state.activeParts).includes('g-spot') ? 0.6 : 0.3;
        
        if (Math.random() < multiChance) {
            newArousal = 80;
            this.state.orgasmCount++;
            isMultiOrgasm = true;
            
            if (this.state.orgasmCount >= 5) {
                newArousal = 0;
            }
        } else {
            newArousal = 20;
            this.state.orgasmCount = 0;
        }
        
        // Check for squirting
        if (Object.keys(this.state.activeParts).includes('g-spot')) {
            isSquirting = Math.random() < 0.7;
        }
        
        // Generate orgasm message
        let message = '';
        if (isMultiOrgasm && this.state.orgasmCount < 5) {
            if (isSquirting) {
                message = `${this.character.name} is having a squirting orgasm! Her juices jet out of her sex with a climax! ${this.character.name}'s arousal remained high, ready to have another one!`;
            } else {
                message = `${this.character.name} is having an orgasm! Her pelvic muscles start to contract rhythmically as she cums! She remains highly aroused.`;
            }
        } else if (isMultiOrgasm && this.state.orgasmCount >= 5) {
            message = `${this.character.name} is having ${this.state.orgasmCount > 1 ? 'another' : 'an'} intense orgasm! Her body convulses violently before she collapses unconscious, completely exhausted!`;
        } else {
            if (isSquirting) {
                message = `${this.character.name} is having a squirting orgasm! Her juices jet out of her sex as she climaxes intensely!`;
            } else {
                message = `${this.character.name} is having an orgasm! Her pelvic muscles start to contract rhythmically as she cums!`;
            }
        }
        
        this.state.arousal = newArousal;
        this.saveState();
        
        return `[Arousal System] ${message}`;
    }
}
