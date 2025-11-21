import { HfInference } from "@huggingface/inference";
const hf = new HfInference("API-KEY");
const result = await hf.translation({
  model: "Helsinki-NLP/opus-mt-en-es",
  inputs: "Hello",
});
console.log(result);
