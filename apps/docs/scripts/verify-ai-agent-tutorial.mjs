import {
  runEmptyRepoTutorial,
  runExistingAgentsTutorial,
  withScratchDir,
} from "../fixtures/ai-agent-tutorial.mjs";

withScratchDir((dir) => {
  runEmptyRepoTutorial(dir);
});

withScratchDir((dir) => {
  runExistingAgentsTutorial(dir);
});

console.log("ai-agent-tutorial: ok");
