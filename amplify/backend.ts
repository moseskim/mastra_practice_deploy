import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";

const backend = defineBackend({
  auth,
});

// 인증 완료된 사용자의 IAM Role을 취득
const authenticatedUserIamRole =
  backend.auth.resources.authenticatedUserIamRole;

// Bedrock용 AWS 매니지드 정책을 추가
authenticatedUserIamRole.addManagedPolicy(
  ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")
);
