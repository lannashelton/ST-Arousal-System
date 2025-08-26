# ST-Arousal-System
*Arousal Tracking System for SillyTavern*

<img width="435" height="568" alt="Image" src="https://github.com/user-attachments/assets/0116e341-5cef-4f73-9868-d7a5a1da3a8c" />

## Installation and Usage

### Installation

Open *Extensions*

Click *Install Extension*

Write `https://github.com/lannashelton/ST-Arousal-System/` into the git url text field


### Usage

Use `/arousal` slash command to open the control window.

**Stimulation Buttons:**
* There are stimulation buttons for various erogenous zones. Click and activate the part you are currently stimulating in roleplay before you send your message.
* All buttons are available for all characters to be able to efficiently cover all kinds of characters.
* Each part have different arousal score and their own unique orgasm dynamics and system messages.
* You can enable multiple parts at same time. If you don't enable any parts, system is disabled.
* Parts have an order of appliance. For example if character reaches orgasm while stimulating "Penis" and "Prostate" at same time, they will have Penile Orgasm. If you want them to have a Prostate Orgasm, you need to avoid stimulating Penis when they are about to reach orgasm.

**Orgasm Meter:**
- When orgasm meter reaches 100, character has an orgasm.
- For best results, add a prompt like this into Author's Notes or Characters Notes injected as System Message at depth 1;
```
**Arousal System**
This roleplay uses an autonomous code called "Arousal System". It increases or decreases {{char}}'s orgasm meter automatically based on events in roleplay. {{char}} has an orgasm when her orgasm meter reaches 100. Never mention orgasm meter during roleplay, just roleplay the consequences of it. When you have an orgasm, Arousal System will let you know. Don't roleplay having an orgasm before Arousal System tells you.
{{char}}'s orgasm meter = {{getglobalvar::arousal_<BOT>_arousal}}
```
- Amount of arousal you gain decreases gradually as the amount of arousal in orgasm meter increases.

**Speed:**
- You can choose to speed up or speed down the rate character's arousal increases after each AI message depending on your personal preference.

**Other Features:**
- Gender neutral system messages allows system to be used in any kind of character identity.
- There is a chance to trigger a multiple orgasm after certain orgasm types. When multiple orgasm is triggered, arousal drops down to 80% instead of 20%, allowing character to have another orgasm soon.
- Some orgasm types bring orgasm meter all the way to 0, some orgasm types bring it down to 30, 50 etc.
- There are 5 intensity levels corresponding to character's current orgasm combo count. It gets more intense as combo count goes up and the system messages changes accordingly.
- If character reaches orgasm when g-spot stimulation is active, they have a squirting orgasm. If they have g-spot orgasm, the chance to have multiple orgasm is higher than normal.
- After each multiple orgasm, the chance to have another one is reduced.
- There is an orgasm combo tracker. If character has 5 successive orgasms non-stop, they are exhausted.

## License

Creative Commons Zero
