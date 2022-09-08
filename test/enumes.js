const OwnableErrorMsg = {
  CALLER_NOT_OWNER: "Ownable: caller is not the owner",
};

const CarbonRetirementAggregatorErrorMsg = {
  CRT_SELECTION_LIMIT: "CRT:Selection must be less than 3",
  CRT_POOL_ADDRESS_ZERO: "CRT:Pool cannot be zero address",
  CRT_BRIDGE_ADDRESS_ZERO: "CRT:Bridge cannot be zero address",
  CRT_POOL_ALREADY_ADDED: "CRT:Pool already added",
  CRT_POOL_NOT_ADDED: "CRT:Pool not added",
};

const CarbonRetirementsStorageErrorMsg = {
  CRS_HELPER_ALREADY_ADDED: "CRS:Helper already added",
  CRS_HELPER_NOT_IN_LIST: "CRS:Helper is not on the list",
  CRS_CALLER_NOT_HELPER: "CRS:Caller is not a defined helper contract",
};

module.exports = {
  OwnableErrorMsg,
  CarbonRetirementAggregatorErrorMsg,
  CarbonRetirementsStorageErrorMsg,
};
