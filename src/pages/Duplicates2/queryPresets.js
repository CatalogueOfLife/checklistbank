export default [
    {
        id: 'c1',
        text: 'ACC-ACC species (different authors)',
        params: {
            authorshipDifferent: true,
            minSize: "2",
            mode: "CANONICAL_WITH_AUTHORS",
            rank: "species",
            status: "accepted",
            withDecision: false
          }
    },
    {
        id: 'c2',
        text: 'ACC-ACC species (same authors)',
        params: {
            authorshipDifferent: false,
            minSize: "2",
            mode: "CANONICAL_WITH_AUTHORS",
            rank: "species",
            status: "accepted",
            withDecision: false
          }
    },
    {
        id: 'c3',
        text: 'ACC-ACC infraspecies and infraspecies marker (different authors)',
        params: {
            authorshipDifferent: true,
            minSize: "2",
            mode: "CANONICAL_WITH_AUTHORS",
            rank: "subspecies", // infraspecific
            status: "accepted",
            withDecision: false
          }
    },
    {
        id: 'c4',
        text: 'ACC-ACC infraspecies and infraspecies marker (same authors)',
        params: {
            authorshipDifferent: false,
            minSize: "2",
            mode: "CANONICAL_WITH_AUTHORS",
            rank: "subspecies", // infraspecific
            status: "accepted",
            withDecision: false
          }
    },
    {
        id: 'c5',
        text: 'ACC-SYN species (different parent, different authors)',
        params: {
            authorshipDifferent: true,
            minSize: "2",
            mode: "CANONICAL_WITH_AUTHORS",
            parentDifferent: true,
            rank: "species",
            status: ["accepted", "synonym"],
            withDecision: false
          }
    },
    {
        id: 'c6',
        text: 'ACC-SYN species (different parent, same authors)',
        params: {
            authorshipDifferent: false,
            minSize: "2",
            mode: "CANONICAL_WITH_AUTHORS",
            parentDifferent: true,
            rank: "species",
            status: ["accepted", "synonym"],
            withDecision: false
          }
    },
]



