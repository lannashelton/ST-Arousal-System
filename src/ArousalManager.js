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
        
        // Base chance for successive orgasms by type
        this.multiOrgasmBaseChance = {
            'g-spot': 0.6,
            'prostate': 1.0,
            'vagina': 0.3,
            'generic': 0.1,
            'clitoris': 0.0,
            'penis': 0.0,
            'breasts': 0.0,
            'nipples': 0.0,
            'anal': 0.0
        };
        
        // Post-orgasm arousal levels
        this.postOrgasmArousal = {
            'g-spot': 80,
            'prostate': 80,
            'vagina': 50,
            'clitoris': 30,
            'generic': 20,
            'penis': 0
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
        this.setGlobalVariable('speed', this.state.speed);
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
    
    setSpeed(speed) {
        if (!this.speedLevels[speed]) return;
        this.state.speed = speed;
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
        const activeParts = Object.keys(this.state.activeParts);
        const priority = [
            'penis', 
            'g-spot', 
            'prostate', 
            'vagina', 
            'clitoris'
        ];
        
        // Return the first match in priority order
        for (const type of priority) {
            if (activeParts.includes(type)) {
                return type;
            }
        }
        
        return 'generic';
    }
    
    getReducedMultiChance(type) {
        if (!this.multiOrgasmBaseChance[type]) return 0;
        
        // Apply diminishing returns: 20% reduction per successive orgasm
        const baseChance = this.multiOrgasmBaseChance[type];
        let reducedChance = baseChance * Math.pow(0.8, this.state.orgasmCount);
        return Math.max(0, reducedChance);
    }

    processOrgasm() {
        const orgasmType = this.getOrgasmType();
        const baseChance = this.multiOrgasmBaseChance[orgasmType] || 0;
        const multiChance = this.getReducedMultiChance(orgasmType);
        const isMultiPossible = this.state.orgasmCount < 4;  // Up to 4th multi-orgasm
        
        // Only consider multi-orgasm if we haven't reached the limit
        let newArousal = this.postOrgasmArousal[orgasmType] || 20;
        const isMultiOrgasm = isMultiPossible && (Math.random() < multiChance);
        
        // Always reset orgasm count at 5 or when not having multi
        if (this.state.orgasmCount >= 4 || !isMultiOrgasm) {
            this.state.orgasmCount = 0;
            // For prostate when not multi, arousal drops to 0
            if (!isMultiOrgasm && orgasmType === 'prostate') {
                newArousal = 0;
            }
        } else {
            this.state.orgasmCount++;
        }
        
        // Generate appropriate message
        const intensity = this.state.orgasmCount + 1;
        const message = this.generateOrgasmMessage(orgasmType, intensity);
        
        this.state.arousal = newArousal;
        this.saveState();
        
        return `[Arousal System] ${message}`;
    }
    
    generateOrgasmMessage(type, intensity) {
        const name = this.character.name;
        const intensityWords = ['first', 'second', 'third', 'fourth', 'fi‌fth'];
        const intensityAdjectives = ['', 'powerful', 'intense', 'overwhelming', 'mind-shattering'];
        
        switch(type) {
            case 'penis':
                return this.getPenileMessage(name, intensity);
                
            case 'g-spot':
                return this.getGspotMessage(name, intensity);
                
            case 'prostate':
                return this.getProstateMessage(name, intensity);
                
            case 'vagina':
                return this.getVaginalMessage(name, intensity);
                
            case 'clitoris':
                return this.getClitoralMessage(name, intensity);
                
            default: // Generic
                return this.getGenericMessage(name, intensity);
        }
    }
    
    getPenileMessage(name, intensity) {
        if (intensity === 1) {
            return `${name} has a penile orgasm! Their member pulses and sprays thick ropes of semen!`;
        } else if (intensity === 5) {
            return `${name} has their ${intensityWords[4]} explosive orgasm! Floods of semen pump out as they collapse!`;
        } else {
            return `${name} has another penile orgasm! More cum spurts out as their cock throbs!`;
        }
    }
    
    getGspotMessage(name, intensity) {
        if (intensity === 1) {
            return `${name} has a squirting orgasm! Their vaginal walls ripple as fluid gushes out!`;
        } else if (intensity === 2) {
            return `${name} has a second squirting orgasm! Their legs shake uncontrollably as more fluids jet out!`;
        } else if (intensity === 3) {
            return `${name} has a third intense squirting orgasm! They cry out as pleasure overwhelms them!`;
        } else if (intensity === 4) {
            return `${name} has a fourth overwhelming squirting orgasm! The ground becomes slick with their fluids!`;
        } else {
            return `${name} has the ultimate squirting orgasm! They convulse violently before collapsing from ecstasy!`;
        }
    }
    
    getProstateMessage(name, intensity) {
        if (intensity === 1) {
            return `${name} has a prostate orgasm! Clear precum streams from their cock as their prostate convulses!`;
        } else if (intensity === 2) {
            return `${name} has a second prostate orgasm! Thin streams of precum spray as their pelvis spasms!`;
        } else if (intensity === 3) {
            return `${name} has a third intense prostate orgasm! Their torso trembles as pleasure overloads their senses!`;
        } else if (intensity === 4) {
            return `${name} has a fourth overwhelming prostate orgasm! They gasp and thrash uncontrollably!`;
        } else {
            return `${name} has the ultimate prostate orgasm! They collapse unconscious from sensory overload!`;
        }
    }
    
    getVaginalMessage(name, intensity) {
        if (intensity === 1) {
            return `${name} has a vaginal orgasm! Their pelvic muscles contract rhythmically in powerful waves!`;
        } else if (intensity === 2) {
            return `${name} has another vaginal orgasm! Deep tremors shake their body as pleasure peaks again!`;
        } else if (intensity === 3) {
            return `${name} has a third intense vaginal orgasm! Their entire body convulses uncontrollably!`;
        } else if (intensity === 4) {
            return `${name} has a fourth overwhelming vaginal orgasm! They scream as pleasure crests in powerful waves!`;
        } else {
            return `${name} has the ultimate vaginal orgasm! They collapse from overwhelming sensory overload!`;
        }
    }
    
    getClitoralMessage(name, intensity) {
        if (intensity === 1) {
            return `${name} has a clitoral orgasm! Sharp bursts of pleasure radiate from their sensitive nub!`;
        } else if (intensity === 2) {
            return `${name} has another clitoral orgasm! Waves of pleasure shoot through their body!`;
        } else if (intensity === 3) {
            return `${name} has a particularly intense clitoral orgasm! Their back arches instinctively!`;
        } else if (intensity === 4) {
            return `${name} has a fourth overwhelming clitoral orgasm! Bright spots dance across their vision!`;
        } else {
            return `${name} has the ultimate clitoral orgasm! They pass out from the relentless sensations!`;
        }
    }
    
    getGenericMessage(name, intensity) {
        if (intensity === 1) {
            return `${name} has an orgasm! Their pelvic muscles contract rhythmically as pleasure washes over them!`;
        } else if (intensity === 2) {
            return `${name} has another orgasm! Ripples of pleasure course through their exhausted body!`;
        } else if (intensity === 3) {
            return `${name} has an intense third orgasm! Sweat glistens on their trembling limbs!`;
        } else if (intensity === 4) {
            return `${name} has a fourth powerful orgasm! Their entire body convulses violently!`;
        } else {
            return `${name} has the ultimate orgasm! They collapse unconscious after ${intensity} climaxes!`;
        }
    }
}
