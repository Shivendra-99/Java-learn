import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { MemoryDiagram } from "@/components/diagram/memory-diagram"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"

const primitives = `static void increment(int n) {
    n = n + 1;                 // changes the copy in THIS frame
}

int count = 5;
increment(count);
System.out.println(count);     // 5 — the caller's variable never moved`

const objectsMutate = `static void addItem(List<String> list) {
    list.add("new");           // follows the reference, changes the shared object
}

List<String> items = new ArrayList<>();
addItem(items);
System.out.println(items);     // [new] — the caller sees it`

const objectsReassign = `static void replace(List<String> list) {
    list = new ArrayList<>();  // repoints this frame's copy of the reference
    list.add("new");           // fills the NEW list, which nobody else can see
}

List<String> items = new ArrayList<>(List.of("original"));
replace(items);
System.out.println(items);     // [original] — untouched`

const swapPredictor = `public class Swap {
    static class Box { String label; Box(String l) { label = l; } }

    static void swap(Box x, Box y) {
        Box temp = x;
        x = y;
        y = temp;
    }

    public static void main(String[] args) {
        Box a = new Box("A");
        Box b = new Box("B");
        swap(a, b);
        System.out.println(a.label + b.label);
    }
}`

const stringPredictor = `public class Immutable {
    static void shout(String text) {
        text = text.toUpperCase();
    }

    static void shout(StringBuilder text) {
        text.append("!");
    }

    public static void main(String[] args) {
        String s = "hi";
        StringBuilder sb = new StringBuilder("hi");
        shout(s);
        shout(sb);
        System.out.println(s + " " + sb);
    }
}`

export default function PassByValueLesson() {
  return (
    <>
      <p>
        Java is <strong>always</strong> pass-by-value. That sentence causes more arguments than any other in the
        language, because people watch a method modify their object and conclude it must be pass-by-reference. Both
        observations are correct; the resolution is that what gets copied is the <em>reference</em>, not the object.
      </p>

      <h2>Primitives: obviously copied</h2>
      <CodeBlock language="java" filename="nothing surprising here" code={primitives} />

      <h2>Objects: the reference is copied</h2>
      <CodeBlock language="java" filename="mutation is visible" code={objectsMutate} />
      <CodeBlock language="java" filename="reassignment is not" code={objectsReassign} />
      <p>
        These two snippets are the whole lesson. The first changes the object both references point at. The second
        changes which object one reference points at — and since that reference is a local copy, the caller is
        unaffected. If Java were pass-by-reference, the second one would work too.
      </p>

      <MemoryDiagram
        title="Why swap cannot work in Java"
        steps={[
          {
            label: "Before the call",
            detail: "Two variables in main, each pointing at its own Box.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "box@A" },
                  { name: "b", ref: "box@B" },
                ],
              },
            ],
            heap: [
              { id: "box@A", type: "Box", fields: [["label", "\"A\""]] },
              { id: "box@B", type: "Box", fields: [["label", "\"B\""]] },
            ],
          },
          {
            label: "swap(a, b) — parameters bound",
            detail: "x and y are new variables in a new frame, holding copies of the two references. Four arrows now, still two objects.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "box@A" },
                  { name: "b", ref: "box@B" },
                ],
              },
              {
                id: "swap",
                label: "swap(Box, Box)",
                vars: [
                  { name: "x", ref: "box@A" },
                  { name: "y", ref: "box@B" },
                ],
              },
            ],
            heap: [
              { id: "box@A", type: "Box", fields: [["label", "\"A\""]] },
              { id: "box@B", type: "Box", fields: [["label", "\"B\""]] },
            ],
          },
          {
            label: "x = y; y = temp;",
            detail: "The two copies are exchanged. main's a and b are untouched — swap has no way to reach into another frame.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "box@A" },
                  { name: "b", ref: "box@B" },
                ],
              },
              {
                id: "swap",
                label: "swap(Box, Box)",
                vars: [
                  { name: "x", ref: "box@B" },
                  { name: "y", ref: "box@A" },
                  { name: "temp", ref: "box@A" },
                ],
              },
            ],
            heap: [
              { id: "box@A", type: "Box", fields: [["label", "\"A\""]] },
              { id: "box@B", type: "Box", fields: [["label", "\"B\""]] },
            ],
          },
          {
            label: "swap returns",
            detail: "The frame is discarded along with every change it made. main prints \"AB\" — a working swap is simply not expressible as a Java method.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "box@A" },
                  { name: "b", ref: "box@B" },
                ],
              },
            ],
            heap: [
              { id: "box@A", type: "Box", fields: [["label", "\"A\""]] },
              { id: "box@B", type: "Box", fields: [["label", "\"B\""]] },
            ],
          },
        ]}
      />

      <OutputPredictor
        code={swapPredictor}
        options={[
          { id: "a", text: "AB" },
          { id: "b", text: "BA" },
          { id: "c", label: "It does not compile", text: "" },
          { id: "d", label: "It throws NullPointerException", text: "" },
        ]}
        correctId="a"
        explanation={
          <p>
            The method swapped its own two local copies and then threw them away. In C++ you'd take references and
            it would work; in Java there is no way to obtain a handle on the caller's variable. Swapping the{" "}
            <em>contents</em> (<code>String t = x.label; x.label = y.label; y.label = t;</code>) does work, because
            that goes through the arrows to the shared objects.
          </p>
        }
      />

      <AnalogyCard title="Photocopying the address, not moving the house.">
        You write down a friend's address and hand a copy to a decorator. They can go to that house and paint the
        door — you'll see it. They can also scribble out the address on their copy and write a different one — and
        your piece of paper is unchanged. Java always hands over a photocopy of the address.
      </AnalogyCard>

      <h2>Immutability changes what mutation can do</h2>
      <OutputPredictor
        question="String and StringBuilder, same pattern — what prints?"
        code={stringPredictor}
        options={[
          { id: "a", text: "hi hi!" },
          { id: "b", text: "HI hi!" },
          { id: "c", text: "hi hi" },
          { id: "d", text: "HI HI!" },
        ]}
        correctId="a"
        explanation={
          <p>
            Both methods receive a copy of a reference. <code>StringBuilder.append</code> mutates the shared object,
            so the caller sees "hi!". <code>toUpperCase()</code> can't mutate a <code>String</code> — it returns a
            new one, which is assigned to the local copy and discarded. The pass semantics are identical in both
            cases; what differs is whether the object can be changed at all.
          </p>
        }
      />

      <Callout variant="tip" title="A phrase that ends the argument">
        "Java passes references by value." Both halves are needed: you get the reference (so you can mutate the
        object), and you get it by value (so reassigning it changes nothing for the caller).
      </Callout>

      <CommonMistake
        title="an 'out parameter' that quietly does nothing"
        wrong={`static void loadConfig(Config config) {
    config = ConfigLoader.load();   // the caller never sees this
}

Config config = null;
loadConfig(config);
config.getPort();                   // NullPointerException`}
        right={`// Return the value — the normal Java way
static Config loadConfig() {
    return ConfigLoader.load();
}
Config config = loadConfig();

// Or populate an object the caller already owns
static void loadInto(Config target) {
    target.setPort(8080);           // mutation, which does propagate
}`}
        explanation={
          <p>
            Out parameters are a habit from languages with genuine reference parameters. In Java the only ways to
            get a value back to the caller are to return it, or to mutate an object the caller can already reach.
            When you need several values back, return a record.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            When you call a method, its parameters are fresh copies. For a number, that's a copy of the number. For
            an object, it's a copy of the arrow pointing at the object — so the method can change the object, but it
            can't make your variable point somewhere else.
          </p>
        }
        developer={
          <p>
            Argument values are copied onto the callee's frame. For reference types the copied value is the
            reference itself, so both frames point at one heap object: field mutation propagates, reassignment does
            not. This is what makes an actual swap impossible without an extra level of indirection — an array, a
            holder object, or an <code>AtomicReference</code>. It's also why passing a mutable object is a shared
            channel between caller and callee, and why immutable arguments are easier to reason about.
          </p>
        }
        interview={
          <p>
            Say "Java is always pass-by-value; for objects, the value passed is the reference", then demonstrate
            with the two cases: mutation visible, reassignment invisible. The <code>swap</code> example is the
            fastest proof, and being able to say "if Java were pass-by-reference, swap would work" usually ends the
            discussion. Expect a follow-up on why a <code>String</code> parameter seems immune — that's
            immutability, not pass semantics.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which single change would make a Java swap method work?"
        options={[
          { id: "a", text: "Declaring the parameters final" },
          { id: "b", text: "Passing an array or holder object and swapping its contents" },
          { id: "c", text: "Marking the method static" },
          { id: "d", text: "Nothing — it already works for objects" },
        ]}
        correctId="b"
        explanation="Adding a level of indirection gives the method something shared to mutate: swap arr[0] and arr[1], and the caller sees it because both frames point at the same array. That is the standard workaround, and needing it is itself evidence that Java is pass-by-value."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Three attempts at swapping"
        hint={
          <p>
            The third version needs something both frames can reach — a two-element array, or a small mutable
            holder class.
          </p>
        }
      >
        Write three swap methods: one taking two <code>int</code>s, one taking two objects and reassigning the
        parameters, and one taking a container and swapping its contents. Predict which works before running.
        Then write one sentence explaining why exactly one of them succeeded.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Is Java pass-by-value or pass-by-reference?"
        answer={
          <p>
            Always pass-by-value. The confusion comes from reference types: the value being copied is the reference,
            so the caller and the callee end up pointing at the same heap object. That's why a method can call{" "}
            <code>list.add(...)</code> and the caller sees the change — the mutation happened to the shared object,
            not to the variable. But assigning a new object to the parameter only repoints the callee's local copy,
            and the caller's variable is untouched. The clinching demonstration is that you cannot write a working{" "}
            <code>swap(a, b)</code> in Java: in a genuinely pass-by-reference language you could, because the method
            would receive an alias for the caller's variables rather than a copy of their contents. The precise
            phrasing is "Java passes references by value".
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Java is always pass-by-value; for objects, the value copied is the reference.",
          "Mutating the object through a parameter is visible to the caller.",
          "Reassigning the parameter is invisible to the caller — it only moves the local copy.",
          "A true swap method is impossible without indirection, which is the proof of pass-by-value.",
          "A String parameter seems immune only because String is immutable, not because of pass semantics.",
        ]}
      />
    </>
  )
}
