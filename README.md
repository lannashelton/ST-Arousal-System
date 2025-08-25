# ST-Arousal-System
*Arousal Tracking System for SillyTavern*

<img width="438" height="388" alt="Image" src="https://github.com/user-attachments/assets/48bb1b86-8fff-48c3-9fa3-85a1e5f6f0ef" />

## Installation and Usage

### Installation

Open *Extensions*

Click *Install Extension*

Write `https://github.com/lannashelton/ST-Arousal-System/` into the git url text field


### Usage

Use `/arousal` slash command to open the control window.

**Stimulation Buttons:**
* There are 6 stimulation buttons for various erogenous zones. Click and activate the part you are currently stimulating in roleplay before you send your message.
* Each part have different arousal score.
* You can enable multiple parts at same time. If you don't enable any parts, system is disabled.

**Orgasm Meter:**
- When orgasm meter reaches 100, character has an orgasm.
- For best results, add a prompt like this into Author's Notes or Characters Notes injected as System Message at depth 1;
```
**Arousal System**
This roleplay uses an autonomous code called "Arousal System". It increases or decreases {{char}}'s orgasm meter automatically based on events in roleplay. {{char}} has an orgasm when her orgasm meter reaches 100. Never mention orgasm meter during roleplay, just roleplay the consequences of it. When you have an orgasm, Arousal System will let you know. Don't roleplay having an orgasm before Arousal System tells you.
{{char}}'s orgasm meter = {{getglobalvar::arousal_<BOT>_arousal}}
```
- Amount of arousal you gain decreases gradually as the amount of arousal in orgasm meter increases.

**Other Features:**
- There is a chance to trigger a multiple orgasm after each orgasm. When multiple orgasm is triggered, arousal drops down to 80% instead of 20%, allowing character to have another orgasm soon.
- If character reaches orgasm when g-spot stimulation is active, they have a squirting orgasm. If they have g-spot orgasm, the chance to have multiple orgasm is higher than normal.
- After each multiple orgasm, the chance to have another one is reduced.
- There is an orgasm combo tracker. If character has 5 successive orgasms non-stop, they faint from exhaustion.

## Planned Features
- Stimulation buttons such as "Penis" and "Prostate" for characters with a penis. These options will also have their own unique orgasm dynamics.
- Will make system messages completely gender neutral to cover any kind of character and genital combination

## License

Creative Commons Zero
