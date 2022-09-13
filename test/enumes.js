const OwnableErrorMsg = {
  CALLER_NOT_OWNER: "Ownable: caller is not the owner",
};

const CarbonRetirementAggregatorErrorMsg = {
  CRT_SELECTION_LIMIT: "CRT:Selection must be less than 3",
  CRT_POOL_ADDRESS_ZERO: "CRT:Pool cannot be zero address",
  CRT_BRIDGE_ADDRESS_ZERO: "CRT:Bridge cannot be zero address",
  CRT_POOL_ALREADY_ADDED: "CRT:Pool already added",
  CRT_POOL_NOT_ADDED: "CRT:Pool not added",
  CRA_POOL_NOT_ACCEPTED: "CRA:Pool Token Not Accepted.",
  CRA_SOURCE_TRANSFERRED: "CRA:Source tokens not transferred.",
};

const CarbonRetirementsStorageErrorMsg = {
  CRS_HELPER_ALREADY_ADDED: "CRS:Helper already added",
  CRS_HELPER_NOT_IN_LIST: "CRS:Helper is not on the list",
  CRS_CALLER_NOT_HELPER: "CRS:Caller is not a defined helper contract",
};

const RetireToucanCarbonErrorMsg = {
  RTC_AMOUNT_INVALID: "RTC:amount must be less than 10000",
  RTC_POOL_ADDRESS_INVALID: "RTC:Pool cannot be zero address",
  RTC_ROUTER_ADDRESS_INVALID: "RTC:Router cannot be zero address",
  RTC_POOL_NOT_EXISTS: "RTC:Pool not added",
  RTC_NOT_TOUCAN_TOKEN: "RTC:Not a Toucan Carbon Token.",
};

module.exports = {
  OwnableErrorMsg,
  CarbonRetirementAggregatorErrorMsg,
  CarbonRetirementsStorageErrorMsg,
  RetireToucanCarbonErrorMsg,
};
