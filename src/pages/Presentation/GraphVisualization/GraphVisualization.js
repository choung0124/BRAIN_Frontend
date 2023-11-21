import React, { useEffect, useRef, useState, useMemo } from "react";
import PropTypes from "prop-types";
import DefaultNavbar from "../SearchBar";
import "./graphcontainer.css";
import MyButton from "./GraphButtons";
import MKButton from "components/MKButton";
import parseRelationships from "./ParseRelationships";
import StaticGraph from "./StaticGraph";
import { Container, Modal, Slide, IconButton } from "@mui/material";
import MKBox from "components/MKBox";
import CloseIcon from "@mui/icons-material/Close";
import * as d3 from "d3";
import MKInput from "components/MKInput";
import InputAdornment from "@mui/material/InputAdornment";
import MKTypography from "components/MKTypography";
import parseRelationshipsWithoutColors from "./ParseRelationshipsWithout";

// @mui icons
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

import { firebaseAuth } from "firebaseConfig";

const GraphVisualization = ({
  relations,
  clickedNodes,
  onNodeClick,
  originalEntities = [],
  nodeColors,
  setShowModal,
  showButton = true,
  handleNodeZoom,
  setSvg,
  setWidth,
  setHeight,
  zoomRef,
  setGlobalNodes,
  fullGraph,
  answerName,
}) => {
  const svgRef = useRef(null);
  const [node, setNode] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredRelationship, setHoveredRelationship] = useState(null);
  const [quesiton, setQuestion] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [streamingResponseURL, setStreamingResponseURL] = useState(null);
  const uid = firebaseAuth.currentUser.uid;
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answer, setAnswer] = useState(false);
  const [relevantRels, setRelevantRels] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nodesToHighlight, setNodesToHighlight] = useState([]);
  const [linksToHighlight, setLinksToHighlight] = useState([]);

  const handleNodeHover = (nodeName) => {
    console.log("Hovered node:", nodeName);
    setHoveredNode(nodeName);
  };

  // Memorize parsed relationships
  const { nodes, links } = useMemo(
    () => parseRelationships(relations, nodeColors),
    [relations, nodeColors]
  );

  setGlobalNodes(nodes);

  const formattedNodes = nodes.map((node) => ({
    label: node.id,
  }));

  useEffect(() => {
    console.log("Nodes to highlight:", nodesToHighlight);
    const result = StaticGraph({
      nodes,
      links,
      svgRef,
      clickedNodes,
      setHoveredRelationship,
      originalEntities,
      nodeColors,
      nodesToHighlight,
      linksToHighlight,
    });

    setNode(result.node);
    setSvg(result.svg);
    setWidth(result.width);
    setHeight(result.height);
    zoomRef.current = result.zoom;
    setSimulation(result.simulation);

    return () => result.simulation.stop();
  }, [relations, svgRef, handleNodeZoom, nodesToHighlight, linksToHighlight]); // Include handleNodeZoom in dependency array

  const inGraphQA = async (question) => {
    try {
      console.log("Selected answer:", selectedAnswer);
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/in_graph_qa/`, {
        question: question,
        answer_name: selectedAnswer,
        uid: uid,
      });
      setStreamingResponseURL(response.data.url);
      setRelevantRels(response.data.graph_rels);
      console.log("Response:", response);
      const { nodes, links } = parseRelationshipsWithoutColors(response.data.graph_rels);
      setNodesToHighlight(nodes);
      setLinksToHighlight(links);
    } catch (error) {
      console.error("Error in in graph QA:", error);
    }
  };

  const getStreamingResponse = async () => {
    try {
      // Assuming GET is the correct method for the streaming endpoint
      const response = await fetch(streamingResponseURL);

      // Check if the response body is readable stream
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          content += decoder.decode(value, { stream: true });
          setAnswer(content); // Update state less frequently if possible
        }
        setAnswer((prev) => prev + decoder.decode()); // Final decoding
      }
    } catch (error) {
      console.error("Error in streaming response:", error);
    }
  };

  useEffect(() => {
    const processQuestion = async () => {
      if (quesiton && !isGenerating) {
        setIsGenerating(true); // Start generating
        setSelectedAnswer(answerName);
        await inGraphQA(quesiton);
        setIsGenerating(false); // Stop generating
        console.log("rels:", relevantRels);
      }
    };
    processQuestion();
  }, [quesiton]);

  useEffect(() => {
    if (streamingResponseURL) {
      getStreamingResponse();
    }
  }, [streamingResponseURL]);

  useEffect(() => {
    setSelectedAnswer(answerName);
  }, [answerName]);

  return (
    <>
      <div id="node-tooltip" style={{ position: "absolute", visibility: "hidden" }}></div>
      <div
        className="graph-container"
        style={{ position: "relative", height: "100%", display: "flex" }}
      >
        <div className="clicked-nodes-container">
          {clickedNodes.map((node) => {
            const color = nodeColors.get(node);
            return (
              <MyButton key={node} color={color} nodeName={node}>
                {node}
              </MyButton>
            );
          })}
        </div>
        {showButton && (
          <div
            className="modal-button-container"
            style={{ position: "absolute", top: 10, width: "auto", height: "50px" }}
          >
            <MKButton
              variant="gradient"
              color="info"
              onClick={() => {
                setShowModal(true);
              }}
            >
              View Full Graph
            </MKButton>
          </div>
        )}
        <svg ref={svgRef}></svg>
        {node && simulation && (
          <StaticGraph
            nodes={nodes}
            links={links}
            svgRef={svgRef}
            clickedNodes={clickedNodes}
            setHoveredRelationship={setHoveredRelationship}
            originalEntities={originalEntities}
            nodeColors={nodeColors}
            nodesToHighlight={nodesToHighlight}
            linksToHighlight={linksToHighlight}
            handleNodeHover={handleNodeHover}
          />
        )}
        {fullGraph && selectedAnswer && (
          <div style={{ position: "absolute", top: 20, width: "100%", height: "300px" }}>
            <MKBox>
              <MKBox
                display="flex"
                style={{ width: "80%", margin: "0 auto" }}
                justifyContent="center"
              >
                <MKInput
                  variant="outlined"
                  placeholder="Chat"
                  value={inputValue} // <--- This ensures controlled component
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(event) => {
                    if (event.key === "Enter") {
                      setQuestion(inputValue);
                    }
                  }}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </MKBox>
              <MKBox style={{ width: "80%", margin: "0 auto" }}>
                <MKTypography variant="body2" textAlign="left" marginTop={2} px={2}>
                  {answer}
                </MKTypography>
              </MKBox>
            </MKBox>
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, width: "100%", height: "100px" }}>
          {hoveredRelationship ? (
            <DefaultNavbar
              overlay={true}
              sticky
              brand={hoveredRelationship}
              clickedNodes={clickedNodes}
              navbarType="popup"
              navbarColor="blue"
              nodes={formattedNodes}
              onNodeClick={onNodeClick}
            />
          ) : (
            hoveredNode && (
              <DefaultNavbar
                overlay={true}
                sticky
                brand={hoveredNode}
                clickedNodes={clickedNodes}
                navbarType="popup"
                navbarColor="blue"
                nodes={formattedNodes}
                onNodeClick={onNodeClick}
              />
            )
          )}
        </div>
      </div>
    </>
  );
};
GraphVisualization.propTypes = {
  relations: PropTypes.array.isRequired,
  onNodeHover: PropTypes.func,
  onNodeClick: PropTypes.func,
  clickedNodes: PropTypes.array.isRequired,
  originalEntities: PropTypes.array.isRequired,
  nodeColors: PropTypes.object.isRequired,
  setShowModal: PropTypes.func.isRequired,
  showButton: PropTypes.bool.isRequired,
  handleNodeZoom: PropTypes.func,
  setSvg: PropTypes.func.isRequired,
  setWidth: PropTypes.func.isRequired,
  setHeight: PropTypes.func.isRequired,
  zoomRef: PropTypes.object.isRequired,
  setGlobalNodes: PropTypes.func.isRequired,
  fullGraph: PropTypes.bool.isRequired,
  answerName: PropTypes.string.isRequired,
};

const GraphContainer = ({ relations, originalEntities = [], answerName }) => {
  const [clickedNodes, setClickedNodes] = useState([]);
  const [nodeColors, setNodeColors] = useState(new Map());
  const [showModal, setShowModal] = useState(false);
  const [svg, setSvg] = useState(null);
  const [width, setWidth] = useState(null);
  const [height, setHeight] = useState(null);
  const zoomRef = useRef(null);
  const [globalNodes, setGlobalNodes] = useState(null);
  const [fullGraph, setFullGraph] = useState(false);
  const [selectedAnswerName, setSelectedAnswerName] = useState(null);

  const zoomToNode = (nodeName) => {
    const nodeData = globalNodes.find((node) => node.id === nodeName);
    if (nodeData) {
      console.log("Node data:", nodeData); // Log the data of the node to zoom to

      const zoomTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(4)
        .translate(-nodeData.x, -nodeData.y);

      console.log("Zoom transform:", zoomTransform); // Log the computed zoom transform

      svg.transition().duration(750).call(zoomRef.current.transform, zoomTransform);
    }
  };

  const handleNodeRemove = (nodeName) => {
    setClickedNodes((prevNodes) => prevNodes.filter((node) => node !== nodeName));
  };

  const handleNodeClick = (nodeName) => {
    if (clickedNodes.includes(nodeName)) {
      handleNodeRemove(nodeName);
    } else {
      setClickedNodes((prevNodes) => [...prevNodes, nodeName]);
    }
    zoomToNode(nodeName);
  };

  const handleModalClose = (event, reason) => {
    if (reason !== "backdropClick") {
      return;
    }
    setShowModal(false);
  };

  useEffect(() => {
    if (showModal) {
      setFullGraph(true);
      setSelectedAnswerName(answerName);
    } else {
      setFullGraph(false);
    }
  }, [showModal]);

  return (
    <div>
      <GraphVisualization
        fullGraph={fullGraph}
        relations={relations}
        clickedNodes={clickedNodes}
        onNodeClick={handleNodeClick}
        originalEntities={originalEntities}
        nodeColors={nodeColors}
        setNodeColors={setNodeColors}
        setShowModal={setShowModal}
        setSvg={setSvg}
        setWidth={setWidth}
        setHeight={setHeight}
        zoomRef={zoomRef}
        setGlobalNodes={setGlobalNodes}
        answerName={selectedAnswerName}
      />
      {showModal && (
        <MKBox component="section" py={6}>
          <Container>
            <Modal
              open={showModal}
              onClose={handleModalClose}
              sx={{ display: "grid", placeItems: "center" }}
            >
              <Slide direction="down" in={showModal}>
                <MKBox
                  position="relative"
                  width="150vh"
                  height="80vh"
                  display="flex"
                  flexDirection="column"
                  borderRadius="xl"
                  bgColor="white"
                  shadow="xl"
                  mx="auto"
                  jusitifyContent="center"
                  alignItems="center"
                >
                  <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}>
                    {" "}
                    {/* Positioning the close button */}
                    <IconButton
                      edge="end"
                      color="inherit"
                      onClick={() => setShowModal(false)} // onClick handler to close the modal
                      aria-label="close"
                    >
                      <CloseIcon />
                    </IconButton>
                  </div>
                  <GraphVisualization
                    fullGraph={fullGraph}
                    relations={relations}
                    clickedNodes={clickedNodes}
                    onNodeClick={handleNodeClick}
                    originalEntities={originalEntities}
                    nodeColors={nodeColors}
                    setNodeColors={setNodeColors}
                    setShowModal={setShowModal}
                    showButton={false}
                    setSvg={setSvg}
                    setWidth={setWidth}
                    setHeight={setHeight}
                    zoomRef={zoomRef}
                    setGlobalNodes={setGlobalNodes}
                    answerName={selectedAnswerName}
                  />
                </MKBox>
              </Slide>
            </Modal>
          </Container>
        </MKBox>
      )}
    </div>
  );
};

GraphContainer.propTypes = {
  relations: PropTypes.array.isRequired,
  originalEntities: PropTypes.array.isRequired,
  answerName: PropTypes.string.isRequired,
};

export default GraphContainer;
