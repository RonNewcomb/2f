import type { EventHandler } from "src/uif";

export default function () {
  let title: string = "I'm a member of a navbar class";

  console.log(title);

  const open = (x: number, event: Event, element: Element): void => {
    title = "navbar.open() called with " + x + " (a " + typeof x + ") and event " + event + " and element " + element + " and title " + title;
    console.log(title);
  };

  const onclick2 = (x: number, event: Event, element: Element): void => {
    title = "navbar.onClick2() called with " + x + " (a " + typeof x + ") and event " + event + " and element " + element;
    console.log(title);
  };

  const close = () => {};

  const hello = (i: number, str: string) => {
    title = "navbar.hello()";
    console.log(title);
    return `hello ${str} youre #${i}!`;
  };

  const onClickMe: EventHandler = (ev, el) => (title = "onClickMe") && console.log("onClickMe", ev, el);

  const onClickopen = () => (title = "onclickOpen") && console.log(title);

  return <><ul className="back">
    <li onClick={event=>open(1, event, this)}>menu item 1 - {hello(4, "world")}</li>
    <li onclick2="(2)">menu item 2 - click me and inspect console</li>
    <li onClick={onclickopen}>menu item 3: {title}</li>
    <li onClick={onClickMe}>Test the onClick handler</li>
    <li>{hello(5, "world")}</li>
</ul>
<style>
.back{
    background-color: lightblue;
}

li[onClick]:hover {
  text-decoration: underline;
}
</style></>  
;
}
