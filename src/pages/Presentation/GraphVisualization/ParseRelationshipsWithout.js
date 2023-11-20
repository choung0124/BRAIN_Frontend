function parseRelationshipsWithoutColors(relations) {
  const nodeIndex = new Map();
  const links = [];

  console.log(relations);

  const flatRelations = relations.flat(); // Flatten the relations array

  flatRelations.forEach((relation) => {
    if (typeof relation !== "string") {
      console.error("Unexpected non-string element:", relation);
      return; // Skip processing this entry
    }

    // Split the relationship string into individual nodes and relation
    const elements = relation.trim().split(/ -> |, /);

    // A valid relationship should have at least 3 elements: source, relation, and target.
    if (elements.length < 3) {
      console.error("Malformed relationship string:", relation);
      return; // Skip processing this entry
    }

    // Standardize the node name by trimming and converting to lowercase
    const standardizeNodeId = (id) => id.trim().toLowerCase();

    // Create nodes and links for each pair of elements
    for (let i = 0; i < elements.length - 2; i += 2) {
      const sourceId = standardizeNodeId(elements[i]);
      const relation = elements[i + 1].trim();
      const targetId = standardizeNodeId(elements[i + 2]);

      // Check that the source and target nodes are not the same
      if (sourceId === targetId) {
        console.error("Source and target nodes are the same:", sourceId);
        continue; // Skip to the next pair without exiting the loop
      }

      if (!nodeIndex.has(sourceId)) {
        nodeIndex.set(sourceId, { id: sourceId });
      }
      if (!nodeIndex.has(targetId)) {
        nodeIndex.set(targetId, { id: targetId });
      }
      links.push({
        source: nodeIndex.get(sourceId),
        target: nodeIndex.get(targetId),
        relation: relation,
      });
    }
    console.log("Processed links:", links);
  });

  const nodes = Array.from(nodeIndex.values());

  console.log("Processed nodes:", nodes);
  console.log("Processed links:", links);

  return { nodes, links };
}

export default parseRelationshipsWithoutColors;
