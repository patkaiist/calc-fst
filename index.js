const replacements = {
    "ɲ": ["ny", "ni", "nyi"],
    "ŋ": ["ng", "ny"],
    "ʊ": ["ou","o","u"]
};

function replaceWithFirst(variant) {
    // this function undoes digraph > single glyph replacements
    for (const key in replacements) {
        const firstReplacement = replacements[key][0];
        variant = variant.split(key).join(firstReplacement);
    }
    return variant;
}

function generateVariations(input) {
    if (!input || input.length === 0) {
        return [""];
    }
    // we split by morpheme, but keep the full stop for recombining terms later
    const segments = input.replace(/\./g, '.·').split('·');
    let variations = [''];
    for (const segment of segments) {
        const segmentVariations = [];
        for (const variation of variations) {
            const segmentVariants = generateSegmentVariations(segment);
            for (const segmentVariant of segmentVariants) {
                let variant = variation + segmentVariant;
                segmentVariations.push(replaceWithFirst(variant));
            }
        }
        variations = segmentVariations;
    }
    return variations
}

function generateSegmentVariations(segment) {
    let variations = [segment];
    for (const pattern in replacements) {
        let index = 0;
        while ((index = segment.indexOf(pattern, index)) !== -1) {
            for (const replacement of replacements[pattern]) {
                let variant = segment.slice(0, index) + replacement + segment.slice(index + pattern.length)
                variations.push(replaceWithFirst(variant));
            }
            index += 1;
        }
    }

    return variations;
}

// the initial input
let term = 'nyou.pan'

// filter out things we can't use
term = term.replace(/'/g, "’").replace(/[^a-zA-Z'’.%]/g, "")

// then convert digraphs to single glyphs
let temp_term = term.replace(/ng|ny|ni|sh|si|ch|chh|j/g, function(match) {
    switch(match) {
        case 'chh':
            return 'ç';
        case 'ch':
        case 'j':
            return 'ʧ';
        case 'ng':
            return 'ŋ';
        case 'ny':
        case 'ni':
            return 'ɲ';
        case 'sh':
        case 'si':
            return 'ʃ';
        default:
            return match;
    }
});

// create the array of valid search terms
let output = generateVariations(temp_term);

// remove duplicates created by the replacement
output = output.filter((item, index) => output.indexOf(item) === index);

// sort the remaining array
output = output.slice().sort();


// build the query
let query = 'SELECT * FROM `table` WHERE ('
for (let i =0; i < output.length; i++) {
    query += '`headword` LIKE "' + output[i] + '"';
    if (i < output.length -1) {
        query += " OR ";
    }
}
query += ') ORDER BY `headword` ASC LIMIT 25;';

// log all possible spellings
console.log(output)

// log the prepared example query
console.log(query)
