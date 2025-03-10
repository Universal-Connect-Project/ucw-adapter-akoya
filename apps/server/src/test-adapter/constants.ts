import { WidgetJobTypes } from "@repo/utils";

export const TEST_EXAMPLE_A_AGGREGATOR_STRING = "testExampleA";
export const TEST_EXAMPLE_B_AGGREGATOR_STRING = "testExampleB";
export const TEST_EXAMPLE_C_AGGREGATOR_STRING = "testExampleC";

export const TEST_EXAMPLE_A_LABEL_TEXT = "TestExampleA Label";
export const TEST_EXAMPLE_B_LABEL_TEXT = "TestExampleB Label";
export const TEST_EXAMPLE_C_LABEL_TEXT = "TestExampleC Label";

export const testAggregatorMemberGuid = "testAggregatorMemberGuid";

export const testDataRequestValidatorStartTimeError =
  '"start_time" is required';

export const testExampleOauthInstitution = {
  guid: "test bank_oauth",
  code: "test bank_oauth",
  name: "test Bank (Oauth)",
  url: "www.test.com",
  logo_url: `http://localhost:8080/oauth/testExampleA/redirect_from/?code=examplecode&state=test_oauth_connection`,
  supports_oauth: true
}

export const testExampleInstitution = {
  logo_url:
    "https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
  name: "testInstitutionName",
  oauth: false,
  url: "testInstitutionUrl",
};

export const testExampleCredentials = {
  id: "testId",
  field_name: "fieldName",
  field_type: "fieldType",
};

export const testExampleJobResponse = {
  job: {
    guid: "testAggregatorMemberGuid",
    job_type: WidgetJobTypes.AGGREGATION,
  },
};

export const testRouteHandlers = {
  jobRequestHandler: (_req: any, res: any) => {
    res.send(testExampleJobResponse);
  },
};

export const testDataRequestValidators = {
  transactions: (req: any) => {
    if (!req.query.start_time) {
      return testDataRequestValidatorStartTimeError;
    }
    return undefined;
  },
};
