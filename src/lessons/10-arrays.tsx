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

const creating = `// Declare and size — every slot gets the type's default value
int[] counts = new int[5];        // [0, 0, 0, 0, 0]
String[] names = new String[3];   // [null, null, null]
boolean[] seen = new boolean[2];  // [false, false]

// Declare with contents
int[] primes = {2, 3, 5, 7, 11};
String[] days = new String[] {"Mon", "Tue"};   // needed when not on the declaration line

// Reading and writing
primes[0]         // 2
primes[4]         // 11
primes.length     // 5   — a field, not a method. No parentheses.
primes[2] = 99;   // arrays are mutable`

const twoD = `// A rectangular grid
int[][] grid = new int[3][4];     // 3 rows, each of length 4
grid[1][2] = 7;

// Literal form
int[][] board = {
    {1, 2, 3},
    {4, 5, 6}
};

// Jagged: rows can have different lengths, because an int[][] is
// really an array whose elements are themselves int[] references
int[][] jagged = new int[3][];
jagged[0] = new int[] {1};
jagged[1] = new int[] {1, 2, 3};
jagged[2] = new int[] {1, 2};

for (int[] row : jagged) {
    System.out.println(row.length);   // 1, 3, 2
}`

const utilities = `import java.util.Arrays;

int[] values = {5, 3, 9, 1};

Arrays.sort(values);                    // sorts in place: [1, 3, 5, 9]
Arrays.toString(values)                 // "[1, 3, 5, 9]"  — println(values) prints a hash!
Arrays.binarySearch(values, 5)          // 2   (requires a sorted array)
Arrays.fill(values, 0)                  // [0, 0, 0, 0]
int[] copy = Arrays.copyOf(values, 6);  // longer copy, padded with 0
int[] part = Arrays.copyOfRange(values, 1, 3);
Arrays.equals(a, b)                     // element-by-element comparison
Arrays.deepToString(grid)               // for nested arrays
Arrays.stream(values).sum()             // bridge into the Stream API`

const aliasing = `public class Alias {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        int[] b = a;
        b[0] = 99;
        System.out.println(a[0]);
    }
}`

export default function ArraysLesson() {
  return (
    <>
      <p>
        An array is a fixed-length block of same-typed slots, allocated once and never resized. It's the lowest-level
        container in Java, it's what <code>ArrayList</code> is built on, and it's where most people meet two
        important ideas for the first time: default values, and the difference between a reference and the thing it
        points at.
      </p>

      <h2>Creating and using</h2>
      <CodeBlock language="java" filename="arrays" code={creating} />
      <p>
        Two details that catch people out. First, <code>length</code> is a field on arrays but{" "}
        <code>length()</code> is a method on <code>String</code> and <code>size()</code> is a method on
        collections — three spellings for the same idea, and the compiler will remind you every time. Second, a new
        array is never full of nulls-and-nothing: numeric slots start at <code>0</code>, booleans at{" "}
        <code>false</code>, and reference slots at <code>null</code>.
      </p>

      <h2>An array variable holds a reference</h2>
      <p>
        This is the single most important thing to understand about arrays, and it generalises to every object in
        Java. The variable doesn't contain the elements — it contains the address of a block that does.
      </p>
      <MemoryDiagram
        title="Two variables, one array"
        steps={[
          {
            label: "int[] a = {1, 2, 3};",
            detail: "The array itself is allocated on the heap. The variable a holds only a reference to it.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "a", ref: "arr@1" }] }],
            heap: [{ id: "arr@1", type: "int[3]", fields: [["[0]", "1"], ["[1]", "2"], ["[2]", "3"]], tone: "new" }],
          },
          {
            label: "int[] b = a;",
            detail: "Assignment copies the reference, not the array. Now two variables point at the same block — no second array was created.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "arr@1" },
                  { name: "b", ref: "arr@1" },
                ],
              },
            ],
            heap: [{ id: "arr@1", type: "int[3]", fields: [["[0]", "1"], ["[1]", "2"], ["[2]", "3"]] }],
          },
          {
            label: "b[0] = 99;",
            detail: "Writing through b writes into the one shared array — so reading a[0] now gives 99. This is aliasing, and it is behind a large share of surprising bugs.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "arr@1" },
                  { name: "b", ref: "arr@1" },
                ],
              },
            ],
            heap: [{ id: "arr@1", type: "int[3]", fields: [["[0]", "99"], ["[1]", "2"], ["[2]", "3"]], tone: "new" }],
          },
          {
            label: "int[] c = a.clone();",
            detail: "clone() allocates a genuine second array and copies the elements. Now c is independent — changing it leaves a alone.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "arr@1" },
                  { name: "b", ref: "arr@1" },
                  { name: "c", ref: "arr@2" },
                ],
              },
            ],
            heap: [
              { id: "arr@1", type: "int[3]", fields: [["[0]", "99"], ["[1]", "2"], ["[2]", "3"]] },
              { id: "arr@2", type: "int[3]", fields: [["[0]", "99"], ["[1]", "2"], ["[2]", "3"]], tone: "new" },
            ],
          },
        ]}
      />

      <OutputPredictor
        code={aliasing}
        options={[
          { id: "a", text: "1" },
          { id: "b", text: "99" },
          { id: "c", label: "It does not compile", text: "" },
          { id: "d", label: "It throws at runtime", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>int[] b = a</code> copies the reference, so both names refer to one array. Writing through{" "}
            <code>b</code> is writing through <code>a</code>. To get an independent copy, use{" "}
            <code>a.clone()</code> or <code>Arrays.copyOf(a, a.length)</code> — and note that for an array of
            objects, even those give you a <em>shallow</em> copy: new slots, same objects inside them.
          </p>
        }
      />

      <AnalogyCard title="A key to a locker, not the locker itself.">
        Handing someone a copy of your locker key doesn't give them a second locker. They open the same one, and
        anything they put in is there when you look. Copying the key is <code>b = a</code>; renting a second locker
        and moving the contents across is <code>clone()</code>.
      </AnalogyCard>

      <h2>Two-dimensional arrays</h2>
      <CodeBlock language="java" filename="grids" code={twoD} />
      <p>
        Java has no true 2D array. <code>int[][]</code> is an array of references to <code>int[]</code> objects,
        which is why rows can have different lengths and why <code>grid[1]</code> is a perfectly good array on its
        own.
      </p>

      <h2>The Arrays utility class</h2>
      <CodeBlock language="java" filename="java.util.Arrays" code={utilities} />
      <Callout variant="warning" title="println on an array prints garbage">
        Arrays don't override <code>toString</code>, so printing one gives you something like{" "}
        <code>[I@6d06d69c</code> — the type followed by a hash. Use <code>Arrays.toString(array)</code>, or{" "}
        <code>Arrays.deepToString</code> for nested arrays. The same applies to <code>equals</code>:{" "}
        <code>a.equals(b)</code> on arrays is reference comparison, so use <code>Arrays.equals</code>.
      </Callout>

      <CommonMistake
        title="trying to resize an array"
        wrong={`String[] names = new String[2];
names[0] = "Ana";
names[1] = "Ben";
names[2] = "Cara";   // ArrayIndexOutOfBoundsException

// There is no names.add(...) — the length is fixed at creation.`}
        right={`// Either size it correctly up front and copy when you must:
names = Arrays.copyOf(names, 3);
names[2] = "Cara";

// Or use the collection built for this:
List<String> names = new ArrayList<>();
names.add("Ana");
names.add("Ben");
names.add("Cara");`}
        explanation={
          <p>
            An array's length is fixed the moment it's allocated. "Growing" one means allocating a bigger array and
            copying — which is exactly what <code>ArrayList</code> does internally, roughly 1.5× at a time. If you
            don't know the final size in advance, start with the collection rather than reinventing it.
          </p>
        }
      />

      <h2>When to use an array at all</h2>
      <ul>
        <li>
          <strong>Use an array</strong> for a fixed-size run of primitives where memory matters, for interop with
          APIs that take arrays, and inside data structures you're implementing yourself.
        </li>
        <li>
          <strong>Use a List</strong> for basically everything else: it grows, it has a readable{" "}
          <code>toString</code> and <code>equals</code>, and it works with the whole collections and streams
          ecosystem.
        </li>
      </ul>

      <DifficultyLevels
        simple={
          <p>
            An array is a numbered row of boxes, all holding the same kind of thing, and the number of boxes is
            decided when you create it. Counting starts at 0. Assigning one array variable to another gives you two
            names for the same row of boxes, not two rows.
          </p>
        }
        developer={
          <p>
            Arrays are objects: they live on the heap, carry a <code>length</code> field, and inherit from{" "}
            <code>Object</code>. They're also <em>covariant</em> — <code>Object[] o = new String[1]</code> compiles —
            which means stores are checked at runtime and can throw <code>ArrayStoreException</code>. Generics chose
            invariance precisely to avoid that hole. <code>System.arraycopy</code> is the intrinsic behind{" "}
            <code>Arrays.copyOf</code> and <code>ArrayList</code>'s growth.
          </p>
        }
        interview={
          <p>
            Favourite questions: the difference between <code>length</code>, <code>length()</code> and{" "}
            <code>size()</code>; why <code>Arrays.toString</code> is needed; and array covariance versus generic
            invariance. On the last one, the answer is that arrays carry their component type at runtime so the JVM
            can check every store, whereas generics are erased and so must be invariant to stay type-safe at compile
            time.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What does a new String[3] contain immediately after creation?"
        options={[
          { id: "a", text: "Three empty strings" },
          { id: "b", text: "Three nulls" },
          { id: "c", text: "Nothing — it has length 0 until you add items" },
          { id: "d", text: "It throws until every slot is assigned" },
        ]}
        correctId="b"
        explanation="Reference slots default to null, numeric slots to 0, and booleans to false. That's why iterating a partly filled String[] and calling a method on each element is a reliable way to meet NullPointerException."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Prove the copy is shallow"
        hint={
          <p>
            Build a <code>StringBuilder[]</code>, clone it, then call <code>append</code> on an element{" "}
            <em>through the clone</em> and print the original's element.
          </p>
        }
      >
        Create an array of mutable objects, copy it with <code>clone()</code>, and demonstrate two things: that
        replacing a slot in the copy leaves the original untouched, but mutating the object <em>inside</em> a slot
        is visible from both. Then write one sentence explaining the difference — you've just described shallow
        versus deep copying, which comes back in the records lesson.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Arrays are covariant and generics are invariant. What does that mean and why the difference?"
        answer={
          <p>
            Covariant means <code>String[]</code> is a subtype of <code>Object[]</code>, so you can assign one to
            the other. That's convenient but unsound: through the <code>Object[]</code> reference you can attempt to
            store an <code>Integer</code> into what is really a <code>String[]</code>. Java accepts this at compile
            time and throws <code>ArrayStoreException</code> at runtime, because arrays know their component type.
            Generics are invariant — <code>List&lt;String&gt;</code> is <em>not</em> a{" "}
            <code>List&lt;Object&gt;</code> — because generic type information is erased at compile time, so no
            runtime check is possible. Invariance moves the error to compile time, and wildcards (
            <code>? extends</code>, <code>? super</code>) restore the flexibility safely.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Arrays are fixed-length and zero-indexed; the last valid index is length - 1.",
          "New arrays are pre-filled with defaults: 0, false, or null.",
          "An array variable holds a reference — assigning one to another aliases, it does not copy.",
          "Use Arrays.toString and Arrays.equals; the inherited versions print a hash and compare references.",
          "int[][] is an array of arrays, so rows may differ in length.",
        ]}
      />
    </>
  )
}
