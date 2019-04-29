export const FONT_COLOR = "#589b00";
export const BaseStyle = {font: 'Comic Sans MS', fill: FONT_COLOR, align: 'left'};
export const ButtonStyle = { ...BaseStyle,  fontSize: '32px' };
export const DescriptionStyle = { ...BaseStyle, fontSize: '18px' };
export const MARGIN = 24;
export const ITEM_MAP = {
    "Speed": {icon: "speedIcon" , descr: "Doubles movement speed", cost: 80},
    "Fart in a Jar": {icon: "fartJarIcon" , descr: "Adds double-jump ability", cost: 150},
    "Fairie Dust": {icon: "fairieDustIcon" , descr: "Slows fall speed", cost: 200},
    "Big Fist": {icon: "bigFistIcon" , descr: "Higher damage and knock back", cost: 300},
    "Swamp Bubble": {icon: "swampBubbleIcon" , descr: "Takes one free hit & adds bounce ability", cost: 300},
};
