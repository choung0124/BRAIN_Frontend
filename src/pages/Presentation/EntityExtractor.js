import React, { useState, useEffect } from "react";
import axios from "axios";
import Dropdown from "./Dropdown";
import CircularProgress from "@mui/material/CircularProgress";
import { Container, Typography, Grid, Modal } from "@mui/material";

import MKBox from "components/MKBox";
import MKTypography from "components/MKTypography";

import PropTypes from "prop-types";

import ForceDirectedTree from "./InputVisualization/Tree";
import InputModal from "./InputVisualization/InputModal";
import "./EntityExtractor.css";

function* combinations(arr, k) {
  const len = arr.length;
  if (k > len) return;

  const indices = Array.from({ length: k }, (_, i) => i);

  while (true) {
    yield indices.map((i) => arr[i]);

    let i;
    for (i = k - 1; i >= 0 && indices[i] === len - k + i; i--);
    if (i < 0) break;

    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
  }
}

function* product(...args) {
  const pools = args.map((arg) => (Array.isArray(arg) ? arg : [arg]));
  const lens = pools.map((pool) => pool.length);
  const divisors = lens.map((_, i) => lens.slice(i + 1).reduce((acc, len) => acc * len, 1));

  for (let i = 0; i < lens.reduce((acc, len) => acc * len, 1); i++) {
    yield pools.map((pool, j) => pool[Math.floor(i / divisors[j]) % lens[j]]);
  }
}

const buildInitialStructure = (entities) => {
  // Find the entity with the name 'start_node'
  const startNodeEntity = entities.find(([entityName]) => entityName === "start_node");

  // Use the found 'start_node' entity as the parent, or default to a hardcoded 'start node' if not found
  const parentName = startNodeEntity ? startNodeEntity[0] : "start node";

  // Filter out the start_node entity when building the children array
  return {
    name: parentName,
    children: Array.isArray(entities)
      ? entities
          .filter(([entityName]) => entityName !== "start_node")
          .map(([entityName]) => ({
            name: entityName,
            children: [],
          }))
      : [],
  };
};

function EntityExtractor({ initialQuestion }) {
  // Initialize question state with initialQuestion prop
  const [question] = useState(initialQuestion || "");
  const [entities, setEntities] = useState([]);
  const [constituentsDict, setConstituentsDict] = useState({});
  const [entityConstituents, setEntityConstituents] = useState([]);
  const [pathsList, setPathsList] = useState([]);
  const [mainStatus, setMainStatus] = useState(null);
  const [finalAnswer, setFinalAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingEntities, setIsExtractingEntities] = useState(false);
  const [isGraphQARunning, setIsGraphQARunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [clickedNode, setClickedNode] = useState(null);
  const [inputChildren, setInputChildren] = useState("");
  const [graphData, setGraphData] = useState([]); // Initialize with empty array
  const [currentEntityType, setCurrentEntityType] = useState(null);
  const [showGraph, setShowGraph] = useState(false);
  const [answerExists, setAnswerExists] = useState(false);

  useEffect(() => {
    if (initialQuestion !== "" && entities.length === 0 && !isExtractingEntities) {
      handleSubmit();
    }
  }, [initialQuestion]);

  useEffect(() => {
    setGraphData(buildInitialStructure(entities));
  }, [entities]);

  useEffect(() => {
    console.log("entities", entities);
    console.log("constituentsDict", constituentsDict);
    console.log("pathsList", pathsList);
  }, [entities, constituentsDict, pathsList]);

  useEffect(() => {
    entities.forEach(([entityName, entityType]) => {
      // Destructure to get both entityName and entityType
      setConstituentsDict((prev) => ({
        ...prev,
        [entityName]: ["Food", "Metabolite", "Drug"].includes(entityType) ? [entityName] : [], // Conditionally set constituents based on entityType
      }));
    });
  }, [entities]);

  useEffect(() => {
    if (entities.length > 0) {
      // Filter out the entity with name "start_node" and extract entity names
      const entityNames = entities
        .filter(([entityName]) => entityName !== "start_node")
        .map(([entityName]) => entityName);

      setConstituentsDict((prev) => ({
        ...prev,
        start_node: [...(prev.start_node || []), ...entityNames], // Merge previous and new entity names
      }));
    }
  }, [entities]);

  const handleSubmit = async () => {
    setIsExtractingEntities(true);
    try {
      const response = await axios.post("http://192.168.100.41:8000/question/", {
        question: initialQuestion,
      });
      setEntities(response.data.entities_list);
    } catch (error) {
      console.error("Error fetching entities:", error);
    }
    setIsExtractingEntities(false);
    setShowGraph(true);
  };

  const handleNodeClick = (nodeName) => {
    console.log("Clicked node:", nodeName);
    setClickedNode(nodeName);
    setModalOpen(true);

    // Search through the entities array to find the entity type
    // corresponding to the clicked node name.
    const entity = entities.find(([entityName]) => entityName === nodeName);
    const currentEntityType = entity ? entity[1] : null; // if entity is found, entityType is entity[1], else null

    // Set the found entityType to state so it can be used in rendering the modal
    setCurrentEntityType(currentEntityType);
  };

  const updateEntities = (newEntity, entityType = null, remove) => {
    setEntities((prevEntities) => {
      if (remove) {
        return prevEntities.filter(([entityName]) => entityName !== newEntity);
      } else {
        return [...prevEntities, [newEntity, entityType]];
      }
    });
  };

  const updateGraph = (newChildren, parentNodeName, remove) => {
    setGraphData((prevData) => {
      const findAndAddChildren = (node) => {
        if (node.name === parentNodeName) {
          const newChildNodes = newChildren.map((childName) => ({
            name: childName,
            value: 0, // Assume a value of 0 for new nodes
            children: [],
          }));

          // Filter out new nodes whose names already exist among the current children
          const uniqueNewChildNodes = newChildNodes.filter(
            (newChild) => !node.children.some((child) => child.name === newChild.name)
          );

          // Merge the current children with the unique new children
          node.children = [...(node.children || []), ...uniqueNewChildNodes];
          return true;
        }
        return (node.children || []).some(findAndAddChildren);
      };
      const findAndRemoveChildren = (node) => {
        if (node.name === parentNodeName) {
          const newChildNodes = node.children.filter(
            (child) => !newChildren.some((childName) => childName === child.name)
          );

          node.children = newChildNodes;
          return true;
        }
        return (node.children || []).some(findAndRemoveChildren);
      };

      const newData = JSON.parse(JSON.stringify(prevData));
      if (remove) {
        findAndRemoveChildren(newData);
      } else {
        findAndAddChildren(newData);
      }
      console.log("New data:", newData);
      return newData;
    });
  };

  const handleEntityProcessing = (entity, entityConstituents) => {
    // Split entityConstituents by commas and trim each element
    const constituents = entityConstituents;

    // Check if any element is an empty string
    if (constituents.some((item) => item === "")) {
      // If any element is an empty string, set inputError to true
    } else {
      // If all elements are non-empty strings, proceed with the rest of the function

      if (constituents.length > 0) {
        setConstituentsDict((prev) => {
          // Merge existing constituents with new constituents,
          // converting arrays to Sets to ensure uniqueness,
          // then converting back to arrays for the final result.
          const existingConstituentsSet = new Set(prev[entity] || []);
          const newConstituentsSet = new Set(constituents);
          const mergedConstituentsSet = new Set([
            ...existingConstituentsSet,
            ...newConstituentsSet,
          ]);
          return { ...prev, [entity]: Array.from(mergedConstituentsSet) };
        });
        for (const constituent of constituents) {
          setPathsList((prev) => {
            // Check if the path already exists in the pathsList
            const pathExists = prev.some(
              (path) => path.nodes[0] === entity && path.nodes[1] === constituent
            );
            if (!pathExists) {
              // If the path doesn't exist, add it to the pathsList
              return [
                ...prev,
                { nodes: [entity, constituent], relationships: ["contains constituent"] },
              ];
            }
            // If the path exists, return the previous state to avoid adding a duplicate path
            return prev;
          });
        }
      }
    }
  };

  const fetchFinalAnswer = async () => {
    try {
      const response = await axios.post("http://192.168.100.41:8000/answer/", { question });
      setFinalAnswer(response.data.final_answer);
    } catch (error) {
      console.error("Error fetching final answer:", error);
    }
  };

  const checkAnswerExists = async () => {
    try {
      const response = await axios.post("http://192.168.100.41:8000/check_previous/", {
        question,
      });
      if (response.data.status === "success") {
        setAnswerExists(true);
      } else {
        setAnswerExists(false);
      }
    } catch (error) {
      console.error("Error notifying backend:", error);
    }
  };

  const entity = clickedNode ? clickedNode : null;

  const generateUniqueID = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const runGraphQA = async () => {
    setIsLoading(true);
    setIsGraphQARunning(true);
    setShowGraph(false);
    await checkAnswerExists();
    if (answerExists) {
      await fetchFinalAnswer();
      setIsLoading(false);
      setIsGraphQARunning(false);
    } else {
      const batchGraphqaID = generateUniqueID();
      let combinationsToQuery = [];

      // 1. Filter out start_node from entities
      const filteredEntities = entities.filter(([entityName]) => entityName !== "start_node");

      // 2. Filter out start_node from constituentsDict
      const filteredConstituentsDict = Object.keys(constituentsDict).reduce((acc, key) => {
        if (key !== "start_node") {
          acc[key] = constituentsDict[key];
        }
        return acc;
      }, {});

      // 3. Filter out start_node from constituents_paths, assuming it's structured similarly to entities
      const filteredConstituentsPaths = pathsList.filter(
        ([entityName]) => entityName !== "start_node"
      );

      filteredEntities.forEach(([currentEntity, currentEntityType]) => {
        const currentEntityCombinations = [];
        if (
          filteredConstituentsDict[currentEntity] &&
          filteredConstituentsDict[currentEntity].length
        ) {
          const constituents = filteredConstituentsDict[currentEntity];
          let combinationsOfConstituents;
          if (constituents.length > 2) {
            combinationsOfConstituents = Array.from(combinations(constituents, 1));
          } else {
            combinationsOfConstituents = [constituents];
          }
          combinationsOfConstituents.forEach((comb) => {
            const combinationWithTypes = comb.map((constituent) => [
              constituent,
              currentEntityType,
            ]);
            currentEntityCombinations.push(combinationWithTypes);
          });
          currentEntityCombinations.push([[currentEntity, currentEntityType]]);
        } else {
          currentEntityCombinations.push([[currentEntity, currentEntityType]]);
        }
        combinationsToQuery.push(currentEntityCombinations);
      });

      // Take the cartesian product of all the arrays in combinationsToQuery
      const allCombinations = Array.from(product(...combinationsToQuery));

      const uniqueCombinations = [...new Set(allCombinations.map(JSON.stringify))].map(JSON.parse);

      const combinationIDs = uniqueCombinations.map(() => generateUniqueID());

      const combinationsWithIDs = uniqueCombinations.map((combination, index) => {
        return { combination, id: combinationIDs[index] };
      });

      const response = await axios.post("http://192.168.100.41:8000/initial_status/", {
        graphqa_id: batchGraphqaID,
        combination_ids: combinationIDs,
      });

      console.log(response);

      for (const { combination, id } of combinationsWithIDs) {
        const flattenedCombination = [].concat(...combination);

        // Log the combination being sent
        console.log("Sending combination to backend:", flattenedCombination);

        try {
          const response = await axios.post("http://192.168.100.41:8000/graphqa/", {
            question: question,
            entities_list: flattenedCombination,
            constituents_dict: filteredConstituentsDict,
            constituents_paths: filteredConstituentsPaths,
            graphqa_id: batchGraphqaID, // Send the generated graphqa_id to the backend
            combination_id: id, // Send the generated combination_id to the backend
          });

          const { status } = response.data;
          setMainStatus(status);
          // Add the task_ids from this response to the taskIDs array
          console.log("Status:", mainStatus);
        } catch (error) {
          console.error("Error running GraphQA:", error);
        }
      }

      const checkTasksStatus = async () => {
        // You no longer need combinationKeys or promises for individual tasks
        // Simply check the status of the tasks using the graphqaID
        try {
          const response = await axios.post("http://192.168.100.41:8000/tasks/status/", {
            graphqa_id: batchGraphqaID, // Use graphqaID to check status
            question: question,
          });
          const { status, completed } = response.data;
          if (status === "All tasks are finished") {
            setIsLoading(false);
            setIsGraphQARunning(false);
            await fetchFinalAnswer();
          } else {
            // If not all tasks are complete, log completed tasks and retry after a delay
            console.log("Completed tasks:", completed);
            setTimeout(checkTasksStatus, 3000); // Poll every 3 seconds
          }
        } catch (error) {
          console.error("Error checking task status:", error);
          // In case of error, consider tasks incomplete and retry after a delay
          setTimeout(checkTasksStatus, 3000);
        }
      };

      // Start polling for task completion
      checkTasksStatus();
    }
  };

  return (
    <MKBox
      minHeight="75vh"
      width="100%"
      sx={{
        display: "grid",
        placeItems: "center",
        alignItems: "center",
      }}
    >
      <>
        {isExtractingEntities ? (
          <Container>
            <Grid container item xs={12} lg={4} py={1} justifyContent="center" mx="auto">
              <MKTypography variant="h4" color="cyan" mr={2}>
                Extracting Entities
              </MKTypography>
              <CircularProgress />
            </Grid>
          </Container>
        ) : null}

        {!isGraphQARunning && !isExtractingEntities && showGraph && (
          <>
            <Grid container item xs={12} justifyContent="center" spacing={2} py={1} height="100%">
              <div className="block">
                <ForceDirectedTree graphData={graphData} onNodeClick={handleNodeClick} />
              </div>
              {clickedNode && (
                //open modal for each entitiy
                <Modal
                  open={modalOpen}
                  onClose={(e) => {
                    e.preventDefault();
                    setModalOpen(false);
                    if (entityConstituents.length > 0) {
                      handleEntityProcessing(clickedNode, entityConstituents);
                    }
                    setEntityConstituents([]);
                  }}
                  sx={{ display: "grid", placeItems: "center" }}
                >
                  <InputModal
                    currentEntityType={currentEntityType}
                    clickedNode={clickedNode}
                    setInputChildren={setInputChildren}
                    inputChildren={inputChildren}
                    setEntityConstituents={setEntityConstituents}
                    updateGraph={updateGraph}
                    constituentsDict={constituentsDict}
                    setConstituentsDict={setConstituentsDict}
                    pathsList={pathsList}
                    setPathsList={setPathsList}
                    runGraphQA={runGraphQA}
                    entity={entity}
                    updateEntities={updateEntities}
                  />
                </Modal>
              )}
              <div>
                {isLoading && <CircularProgress />} {/* Spinning wheel for GraphQA processing */}
              </div>
            </Grid>
          </>
        )}

        {isGraphQARunning && !finalAnswer && (
          <Container>
            <Grid container item xs={12} lg={4} py={1} justifyContent="center" mx="auto">
              <MKTypography variant="h4" color="cyan" mr={2}>
                Running GraphQA
              </MKTypography>
              <CircularProgress />
            </Grid>
          </Container>
        )}

        {finalAnswer && (
          <Grid item xs={12}>
            <div>
              <MKBox component="section" py={12} display="flex" justifyContent="center">
                <Container>
                  <Grid container spacing={0} justifyContent="center">
                    <Grid item xs={12}>
                      <Typography variant="h4" gutterBottom align="center">
                        Final Answer
                      </Typography>
                      <Typography variant="body1" align="center">
                        {finalAnswer}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Dropdown question={question} originalEntities={entities} />
                    </Grid>
                  </Grid>
                </Container>
              </MKBox>
            </div>
          </Grid>
        )}
      </>
    </MKBox>
  );
}

EntityExtractor.propTypes = {
  initialQuestion: PropTypes.string, // Add this line
};

export default EntityExtractor;
