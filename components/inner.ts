import SomeService from "../services/SomeService.js"; // Chrome/Firefox is apparently understanding & loading this without help; explicit extension needed

SomeService.printer();

export default function () {
  console.log("innerclass ctor");
  return `<i>inner text</i>`;
}
