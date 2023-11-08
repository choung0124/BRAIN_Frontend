// StaticGraph.js
import PropTypes from "prop-types";
import * as d3 from "d3";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";

const StaticGraph = ({ nodes, links, svgRef, setHoveredRelationship, nodeColors }) => {
  // Dimensions
  const container = svgRef.current.parentNode;
  const width = container.clientWidth;
  const height = container.clientHeight;

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

  // Inside your StaticGraph function
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
    .attr("stdDeviation", 14) // Adjust this value to control the fuzziness
    .attr("result", "blur");

  // Replace feOffset with feComponentTransfer to adjust the alpha values
  filter.append("feComponentTransfer").append("feFuncA").attr("type", "linear").attr("slope", 0.2); // Adjust this value to control the gradient

  filter
    .append("feOffset")
    .attr("in", "blur")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("result", "offsetBlur");

  filter
    .append("feFlood")
    .attr("flood-color", "black") // Placeholder color, will be set per node
    .attr("result", "color");

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

  const feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode").attr("in", "offsetBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

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

  // Nodes
  // Define your node group, binding the data to 'g' elements
  const node = g
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g");

  // Now append circles to each group
  node
    .append("circle")
    .attr("r", 5)
    .attr("fill", (d) => nodeColors.get(d.id));

  // Now, within the 'each' function, create and apply the filter to each circle
  node.each(function (d) {
    const color = nodeColors.get(d.id);
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

  // Simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

  node.append("title").text((d) => d.id);
  // Ticked function
  // Ticked function
  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
  }

  return { node, simulation, svg, width, height, zoom };
};

StaticGraph.propTypes = {
  nodes: PropTypes.array.isRequired,
  links: PropTypes.array.isRequired,
  svgRef: PropTypes.object.isRequired,
  clickedNodes: PropTypes.array.isRequired,
};

export default StaticGraph;
