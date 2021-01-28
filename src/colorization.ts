
const gpplColorization = [
    {
        "scope": "keyword.control.gppl",
        "settings": {
            "foreground": "#cc00ff",
            "fontStyle": "bold"
        }
    }
    ,{
        "scope": "keyword.modifier.gppl",
        "settings": {
            "foreground": "#0011ff",
            "fontStyle": "underline"
        }
    }
    ,{
        "scope": "string.gppl",
        "settings": {
            "foreground": "#bb7700",
            "fontStyle": "none"
        }
    }
    ,{
        "scope": "comment.gppl",
        "settings": {
            "foreground": "#22bb00",
            "fontStyle": "none"
        }
    }
];

const getColorization = (): any => {
    return gpplColorization;
};

export {
    getColorization
};