import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";
import "./graph.css";

function RadialTree({ graphData, onNodeClick }) {
  const svgRef = useRef(null);

  useEffect(() => {
    console.log("graphData", graphData);
    d3.select(svgRef.current).selectAll("*").remove();

    const container = svgRef.current.parentNode;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background-color", "none");

    const tree = d3
      .tree()
      .size([2 * Math.PI, Math.min(width, height) / 2 - 120])
      .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

    const hierarchyData = d3.hierarchy(graphData);
    const root = tree(hierarchyData.sort((a, b) => d3.ascending(a.data.name, b.data.name)));

    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll()
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkRadial()
          .angle((d) => d.x)
          .radius((d) => d.y)
      );

    // Append nodes.
    svg
      .append("g")
      .selectAll()
      .data(root.descendants())
      .join("circle")
      .attr("transform", (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`)
      .attr("fill", (d) => (d.children ? "#555" : "#999"))
      .attr("r", 2.5)
      .on("click", (event, d) => {
        // Optionally, call onNodeClick with node data
        onNodeClick && onNodeClick(d.data.name);
      });

    // Append labels.
    svg
      .append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .attr("transform", (d) => {
        const isCenterNode = d.depth === 0;
        // Calculate the angle based on whether it is the center node.
        // For the center node, we don't apply any rotation.
        // For other nodes, apply the rotation based on their radial position.
        const angle = isCenterNode ? 0 : (d.x * 180) / Math.PI - 90;
        const rotation = isCenterNode ? 0 : angle;
        // For the center node, text should be positioned right above it,
        // so no additional rotation is needed.
        // For other nodes, apply additional rotation if the node is on the left side of the circle.
        const additionalRotate = isCenterNode ? 0 : d.x >= Math.PI ? 180 : 0;
        // Apply the transformations to position the text.
        return `rotate(${rotation}) translate(${d.y},0) rotate(${additionalRotate})`;
      })
      .attr("dy", "0.31em")
      .attr("x", (d) => (d.depth === 0 ? 0 : d.x < Math.PI === !d.children ? 6 : -6))
      .attr("text-anchor", (d) =>
        d.depth === 0 ? "middle" : d.x < Math.PI === !d.children ? "start" : "end"
      )
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("fill", "currentColor")
      .text((d) => d.data.name)
      .on("click", (event, d) => {
        // Optionally, call onNodeClick with node data
        onNodeClick && onNodeClick(d.data.name);
      });
  }, [graphData]); // updated dependency array

  return <svg ref={svgRef}></svg>;
}
RadialTree.propTypes = {
  graphData: PropTypes.object.isRequired,
  updateGraph: PropTypes.func.isRequired,
  onNodeClick: PropTypes.func.isRequired,
};

export default RadialTree;
