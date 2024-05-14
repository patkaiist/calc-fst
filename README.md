# calc-fst

This repository represents a minimal working example of the finite state transducer based fuzzy spelling search. It is meant to be run as a simple Node.js command like script.

## Structure

First an object is given which shows all possible replacements. The key for each item must be a single glyph. We convert digraphs to these further down.

```javascript
const replacements = {
    "ɲ": ["ny", "ni", "nyi"],
    "ŋ": ["ng", "ny"],
    "ʊ": ["ou","o","u"]
};
```

Then, this object is used to iterate over the given search term to generate all possible acceptable spelling alternatives. We also split by morpheme, again due to language-specific features, but keep the full stop for recombining terms later.

```javascript
function generateVariations(input) {
    if (!input || input.length === 0) {
        return [""];
    }
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
```

The `cleanOutput()` function handles some redundancy created by the replacements. For example <ny> and <ni> and <nyi> may all occur in non-standard spellings, but <ny> converted to <ni> before <i> results in <nii>, which cannot occur. These replacements are language specific.

```javascript
function cleanOutput(input) {
    return input.replace(/ii|iu/g, function(match) {
        switch (match) {
            case 'ii':
                return 'i';...
            default:
                return match;
        }
    });
}
```


Another function is used to undo the digraph reduction.

```javascript
function replaceWithFirst(variant) {
    // this function undoes digraph > single glyph replacements
    for (const key in replacements) {
        const firstReplacement = replacements[key][0];
        variant = variant.split(key).join(firstReplacement);
    }
    return variant;
}
```

An initial search term is give, in this case `nyou.pan'. Full stops represent syllable boundaries and are couded into the dictionary headwords.

```javascript
let term = 'nyou.pan'
```
We can then prepare the variants. First, we strip out anything that won't occur in a valid search.

```javascript
term = term.replace(/'/g, "’").replace(/[^a-zA-Z'’.%]/g, "")
```
Then digraphs are reduced.

```javascript
term = term.replace(/ng|ny|ni|sh|si|ch|chh|j/g, function(match) {
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
```

An array of all possible variants is then created using our functions above, which we then also filter to remove duplicate values, and sort alphabetically.

```javascript
let output = generateVariations(temp_term);
output = output.filter((item, index) => output.indexOf(item) === index);
output = output.slice().sort();
```

Then, the SQLite query can be built by iterating over these elements. In this example we are only search through headwords, but in the full dictionary we also include searches for definitions, a field for alternate spellings which don't follow the principles above, or any other relevant field which may contain lexical data.

```javascript
let query = 'SELECT * FROM `table` WHERE ('
for (let i =0; i < output.length; i++) {
    query += '`headword` LIKE "' + output[i] + '"';
    if (i < output.length -1) {
        query += " OR ";
    }
}
query += ') ORDER BY `headword` ASC LIMIT 25;';
```
Finally, for the purposes of the minimal working example, the spellings and query are logged to the console.

```javascript
console.log(output)
console.log(query)
```
