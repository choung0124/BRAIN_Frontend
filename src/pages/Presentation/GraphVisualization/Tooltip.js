// @mui material components
import Tooltip from "@mui/material/Tooltip";
import MKButton from "components/MKButton";

function GraphTooltip(nodeName) {
  return (
    <Tooltip title={nodeName} placement="top">
      <MKButton variant="gradient" color="info">
        {nodeName}
      </MKButton>
    </Tooltip>
  );
}

export default GraphTooltip;
