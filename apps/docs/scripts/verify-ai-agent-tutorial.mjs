import {
  runEmptyRepoTutorial,
  runExistingAgentsTutorial,
  runHomeSnippetInit,
  withScratchDir,
} from "../fixtures/ai-agent-tutorial.mjs";

withScratchDir((dir) => {
  runEmptyRepoTutorial(dir);
});

withScratchDir((dir) => {
  runExistingAgentsTutorial(dir);
});

withScratchDir((dir) => {
  runHomeSnippetInit(dir);
});

console.log("ai-agent-tutorial: ok");
