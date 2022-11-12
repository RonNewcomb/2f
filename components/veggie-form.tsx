export default function () {
  const mustBeAnimal = (val: string, form: any) => (val || "").includes("a");
  const mustBeMineral = (val: string, form: any) => (val || "").includes("m");
  const mustBeVegetable = (val: string, form: any) => (val || "").includes("v");
  const mustBeOpt2 = (val: string) => (val || "").includes("2");

  return (
    <>
      <div mustBeAnimal mustBeMineral mustBeVegetable mustBeRacecar>
        <label>Name it:<br /><input type="text" /></label> 
        <div for="mustBeAnimal">Animals have an 'a' in their name</div>
        <div for="mustBeMineral">Minerals have an 'm' in their name</div>
        <div for="mustBeVegetable">Vegetables have an 'v' in their name</div>
        {/* <!-- <mustBeAnimal>Animals have an 'a' in their name</mustBeAnimal>
        <mustBeMineral>Minerals have an 'm' in their name</mustBeMineral>
        <mustBeVegetable>Vegetables have an 'v' in their name</mustBeVegetable> --> */}
      </div>
      <div mustBeAnimal mustBeMineral mustBeVegetable mustBe>
        <label>About it:<br /><textarea></textarea></label>
        <div for="mustBe">this is required</div>
        <div for="mustBeAnimal">Animals have an 'a' in their name</div>
        <div for="mustBeMineral">Minerals have an 'm' in their name</div>
        <div for="mustBeVegetable">Vegetables have an 'v' in their name</div>
      </div>
      <div mustBeOpt2>
        <label>Choose:<br />
          <select>
            <option>opt 1</option>
            <option>opt 2</option>
          </select>
          <div for="mustBeOpt2">Never take the first offer</div>
        </label>
      </div>
      <div for="needsWork">Please correct errors</div>

      <style>
        veggie-form {
          display: block;
        }

        veggie-form > * {
          display: block;
        }

        [needsWork] input,
        [needsWork] select,
        [needsWork] textarea {
          border: 1px solid red;
          background-color: pink;
        }

        [approval] input,
        [approval] select,
        [approval] textarea {
          border: 1px solid green;
          background-color: lightgreen;
        }

        [for="needsWork"] {
          display: none;
        }

        [needsWork] [for="needsWork"] {
          display: block;
        }

        div[for] {
          display: none;
        }

        [mustBeAnimal] [for="mustBeAnimal"] {
          display: block;
        }

        [mustBeMineral] [for="mustBeMineral"] {
          display: block;
        }

        [mustBeVegetable] [for="mustBeVegetable"] {
          display: block;
        }

        [mustBeOpt2] [for="mustBeOpt2"] {
          display: block;
        }
      </style>
    </>
  );
}
