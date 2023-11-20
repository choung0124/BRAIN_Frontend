// DynamicGraph.js
import PropTypes from "prop-types";
import * as d3 from "d3";
import { useEffect, useState } from "react";

const DynamicGraph = ({ nodeGroup, simulation, onNodeHover, onNodeClick }) => {
  const [shadowedNodes, setShadowedNodes] = useState(new Set());

  useEffect(() => {
    // Drag behavior
    nodeGroup.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    nodeGroup
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("filter", "url(#drop-shadow)");
        if (onNodeHover) {
          onNodeHover(d.id);
        }
      })
      .on("mouseout", (event, d) => {
        if (!shadowedNodes.has(d.id)) {
          d3.select(event.currentTarget).attr("filter", null);
        }
      })
      .on("click", (event, d) => {
        const newShadowedNodes = new Set(shadowedNodes);
        if (newShadowedNodes.has(d.id)) {
          newShadowedNodes.delete(d.id);
          d3.select(event.currentTarget).attr("filter", null);
        } else {
          newShadowedNodes.add(d.id);
          d3.select(event.currentTarget).attr("filter", "url(#drop-shadow)");
        }
        setShadowedNodes(newShadowedNodes);
        if (onNodeClick) {
          onNodeClick(d.id);
        }
      });

    // Drag functions
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      console.log("dragstarted");
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
      console.log("dragged");
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      console.log("dragended");
    }
  }, [nodeGroup, simulation, onNodeHover, onNodeClick, shadowedNodes]);
};

DynamicGraph.propTypes = {
  node: PropTypes.object.isRequired,
  simulation: PropTypes.object.isRequired,
  onNodeHover: PropTypes.func,
  onNodeClick: PropTypes.func,
  clickedNodes: PropTypes.array.isRequired,
};

export default DynamicGraph;
