import SomeService from "../services/SomeService"; // browser loads this without help if the .js extension is specified

SomeService.printer();

export default function () {
  console.log("inner running");
  return "I N N E R   T E X T ";
}
