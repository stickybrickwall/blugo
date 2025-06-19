export const answerToTagMap: {
    [question: string]: {
        [answer: string]: { tag: string; score: number }[];
    };
} = {
    "How does your skin feel right after washing?": {
        "Very dry and tight": [
            { tag: "dry", score: 3 }, 
            { tag: "dehydration", score: 2 }, 
            { tag: "sensitive", score: 1 }],
        "Dry and tight": [
            { tag: "dry", score: 2 }, 
            { tag: "dehydration", score: 1 }],
        "Normal": [
            { tag: "balanced", score: 2 }]
    },
    "How oily does your skin feel by midday?": {
        "Not oily": [
            { tag: "balanced", score: 2 }
        ],
        "Oily": [
            { tag: "oily", score: 2 },
            { tag: "clogged pores", score: 1 }
        ],
        "Very oily": [
            { tag: "oily", score: 3 },
            { tag: "clogged pores", score: 2 },
            { tag: "acne-prone", score: 2 }
        ]
    }
};