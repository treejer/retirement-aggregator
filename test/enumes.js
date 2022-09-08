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

module.exports = {
  OwnableErrorMsg,
  CarbonRetirementAggregatorErrorMsg,
};
