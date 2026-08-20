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

const regions = `Stack                          Heap
-----                          ----
one per thread                 one, shared by every thread
holds stack frames             holds every object and array
  - local variables            objects live until unreachable
  - parameters                 sized with -Xms / -Xmx
  - the reference itself       garbage collected
fixed, small (~512KB-1MB)      large (often gigabytes)
frame popped on return         no automatic scope-based cleanup
StackOverflowError             OutOfMemoryError: Java heap space

Also present: metaspace (class metadata, static fields),
the code cache (JIT output), and thread stacks themselves.`

const example = `public class Profile {
    public static void main(String[] args) {
        int count = 3;                       // primitive: the VALUE is in the frame
        String name = "Ana";                 // reference: the ARROW is in the frame
        int[] scores = {90, 85};             // ditto — the array is on the heap
        User user = new User(name, scores);
        rename(user);
        System.out.println(user.name);
    }

    static void rename(User u) {
        u.name = "Renamed";                  // follows the arrow, edits the object
        u = new User("Fresh", null);         // repoints the LOCAL copy only
    }
}`

const aliasPredictor = `public class Sharing {
    static class Counter { int value; }

    public static void main(String[] args) {
        Counter a = new Counter();
        Counter b = a;
        a.value = 5;
        b.value = b.value + 1;
        System.out.println(a.value + " " + b.value);
    }
}`

const escapes = `// Roughly where things live:

int total = 0;                    // value in the stack frame
Integer boxed = 1000;             // reference in the frame, Integer object on the heap
int[] data = new int[1000];       // reference in the frame, 4KB array on the heap
String s = "hi";                  // reference in the frame, String in the pool (heap)
static Config config = ...;       // static field: not in any frame; a GC root

// Escape analysis: if the JIT proves an object never leaves a method,
// it may allocate it on the stack or eliminate it entirely — which is
// why "objects are always on the heap" is true of the language spec
// and not necessarily of the running program.`

export default function StackAndHeapLesson() {
  return (
    <>
      <p>
        Java gives you two places where data lives, and almost every confusing behaviour in the language — aliasing,
        null, why a method can change your object but not your variable — becomes obvious once you can picture
        which one holds what.
      </p>

      <h2>Two regions, different rules</h2>
      <CodeBlock language="text" filename="stack vs heap" code={regions} />

      <h2>Watch both at once</h2>
      <MemoryDiagram
        title="Following one program through memory"
        steps={[
          {
            label: "int count = 3;",
            detail: "A primitive local. The value 3 sits directly in main's frame — there is no heap object involved at all.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "count", value: "3" }] }],
            heap: [],
          },
          {
            label: "String name = \"Ana\";",
            detail: "The variable holds a reference. The characters live on the heap, in the string pool — so the frame holds an arrow, not the text.",
            stack: [
              { id: "main", label: "main()", vars: [{ name: "count", value: "3" }, { name: "name", ref: "str@1" }] },
            ],
            heap: [{ id: "str@1", type: "String", fields: [["value", "\"Ana\""]], tone: "new" }],
          },
          {
            label: "User user = new User(name, scores);",
            detail: "A second heap object, whose own name field points at the same String. Objects reference other objects — the heap is a graph, not a list.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "count", value: "3" },
                  { name: "name", ref: "str@1" },
                  { name: "user", ref: "usr@1" },
                ],
              },
            ],
            heap: [
              { id: "str@1", type: "String", fields: [["value", "\"Ana\""]] },
              { id: "usr@1", type: "User", fields: [["name", "-> str@1"], ["scores", "-> arr@1"]], tone: "new" },
            ],
          },
          {
            label: "rename(user) — inside the method",
            detail: "A new frame with its own variable u, holding a COPY of the reference. Two arrows, one object. u.name = \"Renamed\" follows the arrow and edits usr@1, which main can see.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "count", value: "3" },
                  { name: "name", ref: "str@1" },
                  { name: "user", ref: "usr@1" },
                ],
              },
              { id: "rename", label: "rename(User)", vars: [{ name: "u", ref: "usr@1" }] },
            ],
            heap: [
              { id: "str@1", type: "String", fields: [["value", "\"Ana\""]] },
              { id: "usr@1", type: "User", fields: [["name", "\"Renamed\""], ["scores", "-> arr@1"]], tone: "new" },
            ],
          },
          {
            label: "u = new User(\"Fresh\", null);",
            detail: "This repoints only the local copy inside rename's frame. main's user still points at usr@1 — assignment to a parameter is invisible to the caller.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "count", value: "3" },
                  { name: "name", ref: "str@1" },
                  { name: "user", ref: "usr@1" },
                ],
              },
              { id: "rename", label: "rename(User)", vars: [{ name: "u", ref: "usr@2" }] },
            ],
            heap: [
              { id: "str@1", type: "String", fields: [["value", "\"Ana\""]] },
              { id: "usr@1", type: "User", fields: [["name", "\"Renamed\""], ["scores", "-> arr@1"]] },
              { id: "usr@2", type: "User", fields: [["name", "\"Fresh\""], ["scores", "null"]], tone: "new" },
            ],
          },
          {
            label: "rename returns",
            detail: "The frame is popped, so u is gone. Nothing now references usr@2, making it garbage. main prints \"Renamed\" — the mutation survived, the reassignment did not.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "count", value: "3" },
                  { name: "name", ref: "str@1" },
                  { name: "user", ref: "usr@1" },
                ],
              },
            ],
            heap: [
              { id: "str@1", type: "String", fields: [["value", "\"Ana\""]] },
              { id: "usr@1", type: "User", fields: [["name", "\"Renamed\""], ["scores", "-> arr@1"]] },
              { id: "usr@2", type: "User", fields: [["name", "\"Fresh\""], ["scores", "null"]], tone: "garbage" },
            ],
          },
        ]}
      />
      <CodeBlock language="java" filename="the code being traced" code={example} />

      <AnalogyCard title="Desks and a warehouse.">
        Each worker has their own desk — small, private, cleared completely when they finish a task. That's a stack
        frame. The warehouse is shared: anything big goes there, anyone with an aisle number can go and look at it,
        and a crate stays until nobody has the number written down any more. Writing down someone else's aisle
        number doesn't duplicate the crate.
      </AnalogyCard>

      <h2>Aliasing</h2>
      <OutputPredictor
        code={aliasPredictor}
        options={[
          { id: "a", text: "5 6" },
          { id: "b", text: "6 6" },
          { id: "c", text: "5 1" },
          { id: "d", text: "6 1" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>b = a</code> copies the reference, so both variables point at one <code>Counter</code>. Setting{" "}
            <code>a.value = 5</code> and then incrementing through <code>b</code> both act on the same object, so
            both names report 6. There is only ever one counter here — the second variable is a second arrow, not a
            second box.
          </p>
        }
      />

      <h2>What goes where</h2>
      <CodeBlock language="java" filename="a rough map" code={escapes} />
      <Callout variant="info" title="Two errors, two regions">
        <code>StackOverflowError</code> means one thread's stack is full — nearly always runaway recursion, and it's
        tiny to begin with. <code>OutOfMemoryError: Java heap space</code> means the heap is full and the collector
        couldn't free enough — a leak, or genuinely needing more than <code>-Xmx</code> allows. Knowing which one
        you have tells you where to look.
      </Callout>

      <CommonMistake
        title="expecting a method to replace the caller's object"
        wrong={`static void reset(StringBuilder sb) {
    sb = new StringBuilder();     // repoints the local copy only
}

StringBuilder text = new StringBuilder("hello");
reset(text);
System.out.println(text);         // "hello" — unchanged`}
        right={`// Either mutate the object the caller gave you:
static void reset(StringBuilder sb) {
    sb.setLength(0);              // follows the reference
}

// Or return the new value and let the caller assign it:
static StringBuilder reset() {
    return new StringBuilder();
}
text = reset();`}
        explanation={
          <p>
            The parameter is a copy of the reference held in a different frame. Assigning to it changes where{" "}
            <em>that copy</em> points and nothing else. You can change the object through the reference, or hand a
            new reference back — but you can never reach into the caller's frame.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Small, short-lived things — the variables inside a method — live on the stack, which is cleared
            automatically when the method finishes. Objects live on the heap and stay there as long as something
            still points at them. A variable that "holds an object" really holds its address.
          </p>
        }
        developer={
          <p>
            Each thread gets its own stack of frames containing locals and an operand stack; size is set with{" "}
            <code>-Xss</code>. The heap is shared, generational in most collectors, and sized with{" "}
            <code>-Xms</code>/<code>-Xmx</code>. Class metadata and static fields live in metaspace, outside the
            heap. Escape analysis lets the JIT scalar-replace or stack-allocate objects that provably don't escape,
            so "every object is on the heap" is a language-level statement, not a runtime guarantee.
          </p>
        }
        interview={
          <p>
            Have the comparison ready — per-thread versus shared, automatic versus garbage-collected,{" "}
            <code>StackOverflowError</code> versus <code>OutOfMemoryError</code>. Then the two consequences that
            matter: aliasing (two references, one object) and why reassigning a parameter is invisible to the
            caller. Mentioning escape analysis is a good way to show you know where the simple model stops being
            literally true.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Where do a method's local variables live when the method has been called from two threads at once?"
        options={[
          { id: "a", text: "On the shared heap, so both calls see the same values" },
          { id: "b", text: "Each thread has its own stack, so each call has its own independent copy" },
          { id: "c", text: "In metaspace, alongside the class" },
          { id: "d", text: "In the same frame, protected by a lock" },
        ]}
        correctId="b"
        explanation="Stacks are per thread, so locals are inherently thread-confined — which is why they never need synchronisation. Shared mutable state is always heap state: fields of objects both threads can reach, or static fields."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Trigger both errors on purpose"
        hint={
          <p>
            For the heap, add large arrays to a list in a loop and run with a small <code>-Xmx16m</code>. For the
            stack, write a method that calls itself.
          </p>
        }
      >
        Write two tiny programs: one that exhausts the stack and one that exhausts the heap. Run the heap one with{" "}
        <code>-Xmx16m</code> and again with <code>-Xmx512m</code> and note how the failure point moves. Then explain
        why increasing <code>-Xmx</code> would not have helped the first program at all.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between stack and heap memory in Java?"
        answer={
          <p>
            The <strong>stack</strong> is per thread and holds a frame for each active method call: parameters,
            local variables, and the operand stack. Frames are pushed and popped automatically, so cleanup is free
            and locals are inherently thread-confined. It's small — typically well under a megabyte — and exhausting
            it, usually through unbounded recursion, gives <code>StackOverflowError</code>. The{" "}
            <strong>heap</strong> is shared by all threads and holds every object and array. Its contents live as
            long as they're reachable, are reclaimed by the garbage collector rather than by scope, and it's sized
            with <code>-Xms</code>/<code>-Xmx</code>; exhausting it gives{" "}
            <code>OutOfMemoryError: Java heap space</code>. A local variable of a reference type sits on the stack
            but points into the heap, which is what makes aliasing possible — and why two variables can name one
            object. Class metadata and statics live in metaspace, which is separate from both.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Stack: one per thread, holds frames of locals and parameters, cleaned up automatically.",
          "Heap: shared by all threads, holds every object and array, cleaned up by the garbage collector.",
          "A reference variable lives on the stack and points into the heap — copying it aliases, it doesn't clone.",
          "Mutating through a parameter is visible to the caller; reassigning the parameter is not.",
          "StackOverflowError means runaway recursion; OutOfMemoryError means the heap is exhausted.",
        ]}
      />
    </>
  )
}
