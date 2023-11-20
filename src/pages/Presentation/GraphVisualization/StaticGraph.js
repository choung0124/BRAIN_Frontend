// StaticGraph.js
import PropTypes from "prop-types";
import * as d3 from "d3";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";

const StaticGraph = ({
  nodes,
  links,
  svgRef,
  setHoveredRelationship,
  nodeColors,
  nodesToHighlight,
  linksToHighlight,
}) => {
  // Dimensions
  console.log("linksToHighlight", linksToHighlight);
  const container = svgRef.current.parentNode;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const highlightedNodeIds = nodesToHighlight.map((node) => node.id);

  // SVG container
  const svg = d3
    .select(svgRef.current)
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", [0, 0, width, width * 0.5]) // Adjust the viewBox to match the aspect ratio of the SVG container
    .attr("style", "max-width: 100%; height: auto; background-color: none;")
    .on("wheel.zoom", null); // Prevent default wheel zoom
  // Clear the SVG container
  svg.selectAll("*").remove();

  // Create a group for the visualization
  const g = svg.append("g");

  // Define the zoom behavior, limiting the scale extent to 0.1-4
  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", function (e) {
      g.attr("transform", e.transform); // Apply zoom transformation to the g element
    });

  // Apply the zoom behavior to the svg element
  svg.call(zoom);

  function isLinkHighlighted(link) {
    if (!link || !link.source || !link.target || !link.source.id || !link.target.id) {
      return false;
    }
    return linksToHighlight.some(
      (highlightedLink) =>
        highlightedLink.source.id === link.source.id && highlightedLink.target.id === link.target.id
    );
  }
  // Links
  const link = g
    .append("g")
    .attr("stroke", (d) => (isLinkHighlighted(d) ? "#9bedff" : "#999"))
    .attr("stroke-opacity", 0.6)
    .selectAll()
    .data(links)
    .join("line")
    .attr("stroke-width", (d) => (isLinkHighlighted(d) ? 3 : 1))
    .on("mouseover", (event, d) => {
      setHoveredRelationship(
        <>
          {d.source.id} <ArrowRightAltIcon /> {d.relation} <ArrowRightAltIcon /> {d.target.id}
        </>
      );
    });

  const nodeGroup = g.append("g").selectAll("g").data(nodes).enter().append("g");

  nodeGroup
    .append("circle")
    .attr("class", "node")
    .attr("r", 5)
    .attr("fill", (d) => nodeColors.get(d.id))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  nodeGroup
    .append("circle")
    .attr("class", "node-highlight")
    .attr("r", 8)
    .attr("fill", (d) => nodeColors.get(d.id))
    .attr("opacity", 0.5)
    .attr("visibility", (d) => (highlightedNodeIds.includes(d.id) ? "visible" : "hidden"));

  nodeGroup
    .append("text")
    .attr("class", "node-label")
    .style("fill", "#000")
    .style("font-size", "0.2em")
    .text((d) => d.id)
    .attr("x", (d) => d.x + 10)
    .attr("y", (d) => d.y + 5)
    .style("pointer-events", "none");

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

  const drag = d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);

  nodeGroup.call(drag);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

  // Ticked function
  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    nodeGroup
      .selectAll("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);

    nodeGroup
      .selectAll("text")
      .attr("x", (d) => d.x + 10)
      .attr("y", (d) => d.y + 5);
  }

  return { nodeGroup, simulation, svg, width, height, zoom };
};

StaticGraph.propTypes = {
  nodes: PropTypes.array.isRequired,
  links: PropTypes.array.isRequired,
  svgRef: PropTypes.object.isRequired,
  clickedNodes: PropTypes.array.isRequired,
};

export default StaticGraph;
