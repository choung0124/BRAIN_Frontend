import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";
import "./graph.css";
const color = d3.scaleOrdinal(d3.schemePastel1);

function ForceDirectedTree({ graphData, onNodeClick }) {
  const svgRef = useRef(null);
  const centeringForce = d3.forceCenter();

  function updateCenteringForce(transform, width, height) {
    centeringForce.x((width / 2 - transform.x) / transform.k);
    centeringForce.y((height / 2 - transform.y) / transform.k);
    console.log("centeringForce.x", centeringForce.x());
    console.log("centeringForce.y", centeringForce.y());
  }

  useEffect(() => {
    console.log("graphData", graphData);
    d3.select(svgRef.current).selectAll("*").remove();

    const container = svgRef.current.parentNode;
    const width = container.clientWidth;
    const height = container.clientHeight;

    function svgFilter(event) {
      if (event.type === "mousedown") {
        event.stopImmediatePropagation();
      }
    }

    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background-color", "none")
      .on("mousedown", svgFilter); // Apply the filter function to the mousedown event

    const g = svg.append("g");

    const initialTransform = d3.zoomIdentity; // Initial transform is the identity transform
    updateCenteringForce(initialTransform, width, height); // Set the initial centering force values

    const zoom = d3
      .zoom()
      .scaleExtent([0.01, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        updateCenteringForce(event.transform, width, height); // Update the centering force values on zoom
        simulation.alphaTarget(0.3).restart(); // Restart the simulation with a higher alpha to re-heat it
      });
    svg.call(zoom);

    const hierarchyData = d3.hierarchy(graphData);
    const linksData = hierarchyData.links();
    const nodesData = hierarchyData.descendants();

    const link = g
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(linksData)
      .enter()
      .append("line")
      .attr("stroke-width", 2); // Set a constant stroke width of 2

    const node = g.append("g").selectAll("g").data(nodesData).enter().append("g");

    // Append single circle with specified fill, stroke, and shadow filter
    node
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 40 : 35)) // Adjust radius based on node depth
      .attr("fill", (d) => {
        // If node depth is 0 or 1, assign a new color, otherwise use parent's color
        if (d.depth <= 1) {
          d.data.color = color(d.data.name); // Store color in node data
          return d.data.color;
        } else {
          d.data.color = d.parent.data.color; // Use parent's color
          return d.data.color;
        }
      })
      .attr("stroke", (d) => (d.depth === 0 ? "#fff" : "#fff")) // Set stroke color to black
      .attr("stroke-width", 3) // Set stroke width
      .attr("filter", "url(#drop-shadow)"); // Apply shadow filter

    // Append text with its own fill
    node
      .append("text")
      .style("fill", (d) => (d.depth === 0 ? "#fff" : "#000")) // Set text color to black
      .attr("font-weight", (d) => (d.depth === 0 ? "bold" : "normal")) // Set font weight
      .style("font-size", "0.8em") // Set font size
      .attr("dx", (d) => (d.depth === 0 ? "-20" : "50")) // Adjust these values to position the text relative to the node
      .attr("dy", (d) => (d.depth === 0 ? "5" : "1"))
      .text((d) => (d.depth === 0 ? "Start !" : d.data.name))
      .style("pointer-events", "none");

    node.on("click", (event, d) => {
      // Optionally, call onNodeClick with node data
      onNodeClick && onNodeClick(d.data.name);
    });

    const defs = svg.append("defs");

    const filter = defs
      .append("filter")
      .attr("id", "drop-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3) // Adjust this value to control the fuzziness
      .attr("result", "blur");

    filter
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2) // Adjust this value to control horizontal offset
      .attr("dy", 2) // Adjust this value to control vertical offset
      .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    node.each(function (d) {
      const filterId = `drop-shadow-${d.id}`;
      const filter = defs
        .append("filter")
        .attr("id", filterId)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      filter
        .append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 3)
        .attr("result", "blur");

      filter
        .append("feOffset")
        .attr("in", "blur")
        .attr("dx", 0)
        .attr("dy", 0)
        .attr("result", "offsetBlur");

      filter.append("feFlood").attr("flood-color", color).attr("result", "color");

      filter
        .append("feComposite")
        .attr("in", "color")
        .attr("in2", "offsetBlur")
        .attr("operator", "in")
        .attr("result", "shadow");

      filter
        .append("feMerge")
        .selectAll("feMergeNode")
        .data(["shadow", "SourceGraphic"])
        .enter()
        .append("feMergeNode")
        .attr("in", (d) => d);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    function customCenteringForce(alpha) {
      const strength = alpha * 0.1; // Adjust this value to make the centering force stronger or weaker

      return (node) => {
        if (node.depth <= 1) {
          // This line ensures the centering force is applied only to nodes with depth 0 or 1
          node.vx -= (node.x - centeringForce.x()) * strength;
          node.vy -= (node.y - centeringForce.y()) * strength;
        }
      };
    }

    const drag = d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);

    node.call(drag);

    nodesData.forEach((node) => {
      if (node.depth === 0) {
        // If it's the root node
        node.fx = width / 2 + -100;
        node.fy = height / 2;
      } else {
        node.fx = null;
        node.fy = null;
      }
    });

    const simulation = d3
      .forceSimulation(nodesData)
      .force(
        "link",
        d3
          .forceLink(linksData)
          .id((d) => d.id)
          .distance((d) => {
            return d.target.depth > 1 ? 200 : 200;
          })
          .strength(1)
      )
      .force(
        "collide",
        d3.forceCollide().radius(function (d) {
          return d.depth === 0 ? 50 : 45;
        })
      )
      .force("charge", d3.forceManyBody().strength(-50))
      .force("customCenter", () => nodesData.forEach(customCenteringForce(simulation.alpha())))
      .on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
      });

    // Optionally reheat the simulation initially
    simulation.alpha(1).restart(); // You can also use simulation.restart() here if needed
    svg.call(zoom);
  }, [graphData]); // updated dependency array

  return <svg ref={svgRef}></svg>;
}

ForceDirectedTree.propTypes = {
  graphData: PropTypes.object.isRequired,
  onNodeClick: PropTypes.func.isRequired,
};

export default ForceDirectedTree;
