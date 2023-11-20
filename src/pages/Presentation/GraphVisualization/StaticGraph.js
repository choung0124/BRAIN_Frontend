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

  // Links
  const link = g
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll()
    .data(links)
    .join("line")
    .attr("stroke-width", (d) => Math.sqrt(d.value))
    .on("mouseover", (event, d) => {
      setHoveredRelationship(
        <>
          {d.source.id} <ArrowRightAltIcon /> {d.relation} <ArrowRightAltIcon /> {d.target.id}
        </>
      );
    })
    .on("mouseout", () => {
      setHoveredRelationship(null);
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

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

  nodeGroup.append("title").text((d) => d.id);
  // Ticked function
  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    nodeGroup.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
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
