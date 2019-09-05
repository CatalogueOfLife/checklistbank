export default [
  {
    id: "c1",
    text: "ACC-ACC species (different authors)",
    params: {
      authorshipDifferent: true,
      minSize: "2",
      mode: "STRICT",
      category: "binomial",
      status: "accepted",
      withDecision: false
    }
  },
  {
    id: "c2",
    text: "ACC-ACC species (same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      category: "binomial",
      status: "accepted",
      withDecision: false
    }
  },
  {
    id: "c3",
    text: "ACC-ACC infraspecies and infraspecies marker (different authors)",
    params: {
      authorshipDifferent: true,
      minSize: "2",
      mode: "STRICT",
      category: "trinomial", 
      status: "accepted",
      withDecision: false
    }
  },
  {
    id: "c4",
    text: "ACC-ACC infraspecies and infraspecies marker (same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      category: "trinomial", 
      status: "accepted",
      withDecision: false
    }
  },
  {
    id: "c5",
    text: "ACC-SYN species (different accepted, different authors)",
    params: {
      authorshipDifferent: true,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: true,
      category: "binomial",
      status: ["accepted", "synonym"],
      withDecision: false
    }
  },
  {
    id: "c6",
    text: "ACC-SYN species (different accepted, same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: true,
      category: "binomial",
      status: ["accepted", "synonym"],
      withDecision: false
    }
  },
  {
    id: "c7",
    text: "ACC-SYN species (same accepted, same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: false,
      category: "binomial",
      status: ["accepted", "synonym"],
      withDecision: false
    }
  },

  {
    id: "c8",
    text: "ACC-SYN infraspecies (different accepted, different authors)",
    params: {
      authorshipDifferent: true,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: true,
      category: "trinomial",
      status: ["accepted", "synonym"],
      withDecision: false
    }
  },
  {
    id: "c9",
    text: "ACC-SYN infraspecies (different accepted, same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: true,
      category: "trinomial",
      status: ["accepted", "synonym"],
      withDecision: false
    }
  },
  {
    id: "c10",
    text: "ACC-SYN infraspecies (same accepted, same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: false,
      category: "trinomial",
      status: ["accepted", "synonym"],
      withDecision: false
    }
  },
  {
    id: "c11",
    text: "SYN-SYN species (different accepted, different authors)",
    params: {
      authorshipDifferent: true,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: true,
      category: "binomial",
      status: ["synonym"],
      withDecision: false
    }
  },
  {
    id: "c12",
    text: "SYN-SYN species (different accepted, same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: true,
      category: "binomial",
      status: ["synonym"],
      withDecision: false
    }
  },
  {
    id: "c13",
    text: "SYN-SYN species (same accepted, different authors)",
    params: {
      authorshipDifferent: true,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: false,
      category: "binomial",
      status: ["synonym"],
      withDecision: false
    }
  },
  {
    id: "c14",
    text: "SYN-SYN species (same accepted, same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: false,
      category: "binomial",
      status: ["synonym"],
      withDecision: false
    }
  },
  {
    id: "c15",
    text: "SYN-SYN infraspecies (different accepted, different authors)",
    params: {
      authorshipDifferent: true,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: true,
      category: "trinomial",
      status: ["synonym"],
      withDecision: false
    }
  },
  {
    id: "c16",
    text: "SYN-SYN infraspecies (different accepted, same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: true,
      category: "trinomial",
      status: ["synonym"],
      withDecision: false
    }
  },
  {
    id: "c17",
    text: "SYN-SYN infraspecies (same accepted, different authors)",
    params: {
      authorshipDifferent: true,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: false,
      category: "trinomial",
      status: ["synonym"],
      withDecision: false
    }
  },
  {
    id: "c18",
    text: "SYN-SYN infraspecies (same accepted, same authors)",
    params: {
      authorshipDifferent: false,
      minSize: "2",
      mode: "STRICT",
      acceptedDifferent: false,
      category: "trinomial",
      status: ["synonym"],
      withDecision: false
    }
  },
  {
    id: "b1",
    text: "Identical order",
    params: {
      minSize: "2",
      mode: "STRICT",
      category: "uninomial",
      withDecision: false,
      rank: "order"
    }
  },
  {
    id: "b2",
    text: "Identical superfamily",
    params: {
      minSize: "2",
      mode: "STRICT",
      category: "uninomial",
      withDecision: false,
      rank: "superfamily"
    }
  },
  {
    id: "b3",
    text: "Identical family",
    params: {
      minSize: "2",
      mode: "STRICT",
      category: "uninomial",
      withDecision: false,
      rank: "family"
    }
  },
  {
    id: "b4",
    text: "Identical genus",
    params: {
      minSize: "2",
      mode: "STRICT",
      category: "uninomial",
      withDecision: false,
      rank: "genus"
    }
  },
/*   {
    id: "xx",
    text: "Any uninomial",
    params: {
      minSize: "2",
      mode: "STRICT",
      category: "uninomial"
    }
  } */
];
