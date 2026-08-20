import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { Boxes, Copy, Plus, Ruler, TriangleAlert } from "lucide-react"

const api = `List<String> names = new ArrayList<>();

names.add("Ana");                 // append
names.add(0, "Zoe");              // insert at index, shifting the rest right
names.get(0);                     // "Zoe"
names.set(0, "Zed");              // replace, returns the old value
names.remove(0);                  // by INDEX for an int argument
names.remove("Ana");              // by VALUE for an object argument
names.indexOf("Ana");             // first position, or -1
names.contains("Ana");            // O(n) — it has to scan
names.size();
names.subList(1, 3);              // a VIEW, not a copy — writes go through
names.sort(Comparator.naturalOrder());
names.removeIf(String::isBlank);
names.replaceAll(String::trim);`

const complexity = `Operation                ArrayList        LinkedList
----------------------   --------------   ------------------
get(i) / set(i)          O(1)             O(n)  must walk
add(e)  at the end       O(1) amortised   O(1)
add(0, e) at the front   O(n)  shifts     O(1)
remove(i)                O(n)  shifts     O(n) to find + O(1) to unlink
contains(e)              O(n)             O(n)
iterate                  fast, contiguous slow, pointer chasing
memory per element       one slot         object header + 2 pointers + value

The table makes LinkedList look competitive. Measurements rarely do:
walking pointers scattered across the heap defeats the CPU cache, while
an ArrayList's shift is a single bulk memory move.`

const growth = `// ArrayList's internal array grows by roughly 50% when full
new ArrayList<>()            // lazily allocates 10 on first add
// 10 -> 15 -> 22 -> 33 -> 49 -> 73 ...

// Each growth allocates a new array and copies everything across.
// If you know the size, say so — it removes every one of those copies:
List<String> big = new ArrayList<>(100_000);`

const removePredictor = `import java.util.*;

public class Removing {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(List.of(10, 20, 30));
        numbers.remove(1);
        System.out.println(numbers);
    }
}`

const removeFix = `List<Integer> numbers = new ArrayList<>(List.of(10, 20, 30));

numbers.remove(1);                       // index 1 -> removes 20
numbers.remove(Integer.valueOf(10));     // value 10 -> removes 10
numbers.removeIf(n -> n == 30);          // clearest of all`

const deque = `// Do not use java.util.Stack — it is synchronised, extends Vector,
// and iterates in the wrong direction. Use ArrayDeque:
Deque<String> stack = new ArrayDeque<>();
stack.push("a");
stack.push("b");
stack.pop();       // "b"
stack.peek();      // "a"

// The same class is also the best FIFO queue:
Deque<Task> queue = new ArrayDeque<>();
queue.addLast(task);
Task next = queue.pollFirst();`

export default function ListsLesson() {
  return (
    <>
      <p>
        <code>List</code> is the collection you'll reach for most: an ordered sequence that allows duplicates and
        lets you get an element by position. There are two implementations everyone learns, and the interesting part
        is that the one the complexity table flatters is almost never the one to use.
      </p>

      <h2>The API</h2>
      <CodeBlock language="java" filename="List operations" code={api} />

      <Callout variant="warning" title="remove(int) and remove(Object) are different methods">
        With a <code>List&lt;Integer&gt;</code>, <code>remove(1)</code> removes the element{" "}
        <em>at index 1</em>, while <code>remove(Integer.valueOf(1))</code> removes the value 1. Overload resolution
        prefers the <code>int</code> version without boxing, so the compiler quietly picks the one you probably
        didn't mean.
      </Callout>

      <OutputPredictor
        code={removePredictor}
        options={[
          { id: "a", text: "[20, 30]" },
          { id: "b", text: "[10, 30]" },
          { id: "c", text: "[10, 20]" },
          { id: "d", label: "It throws IndexOutOfBoundsException", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>remove(1)</code> matches <code>remove(int index)</code> exactly, with no boxing needed, so it
            removes the element at position 1 — the value 20. Only widening-free exact matches are considered before
            boxing, so the <code>Integer</code> overload never gets a look-in.
          </p>
        }
      />
      <CodeBlock language="java" filename="saying what you mean" code={removeFix} />

      <h2>ArrayList versus LinkedList</h2>
      <CodeBlock language="text" filename="complexity, and reality" code={complexity} />

      <AnalogyCard title="A bookshelf versus a treasure hunt.">
        On a shelf, "the fifth book" is one movement — you reach straight to it. Squeezing a book into the middle
        means sliding the others along, which is fast because they're all adjacent. A linked list is a treasure
        hunt: each clue tells you where the next one is, so finding the fifth means visiting four others, each
        potentially in a different room. Inserting is trivial once you're there; getting there is the problem.
      </AnalogyCard>

      <h2>How an ArrayList grows</h2>
      <StepFlowDiagram
        title="What add() does when the array is full"
        steps={[
          {
            id: "check",
            label: "Check capacity",
            detail: "size == elementData.length? If not, the element is written into the next slot and size incremented. That is the common case and it is very fast.",
            icon: Ruler,
          },
          {
            id: "grow",
            label: "Compute a new capacity",
            detail: "The array grows by about 50% — old + (old >> 1). Growth is geometric so that the average cost per add stays constant.",
            icon: Plus,
            tone: "warning",
          },
          {
            id: "allocate",
            label: "Allocate a bigger array",
            detail: "A fresh array of the new capacity is created on the heap. Briefly, both arrays exist, which is why growing a huge list needs headroom.",
            icon: Boxes,
          },
          {
            id: "copy",
            label: "Copy across",
            detail: "System.arraycopy moves every existing element — an intrinsic that compiles to a bulk memory move, not an element-by-element loop.",
            icon: Copy,
          },
          {
            id: "amortised",
            label: "Amortised O(1)",
            detail:
              "Most adds do no copying, and copies get rarer as the list grows, so the average is constant. Any individual add can still be O(n) — which matters for latency-sensitive code.",
            icon: TriangleAlert,
            tone: "success",
          },
        ]}
      />
      <CodeBlock language="java" filename="pre-size when you can" code={growth} />

      <h2>When is LinkedList actually right?</h2>
      <p>
        Rarely. It wins when you're inserting or removing repeatedly at a position you already hold an{" "}
        <code>Iterator</code> for, and when the list is large enough that shifting hurts. For queue and stack
        behaviour, <code>ArrayDeque</code> beats it on both speed and memory. Its main claim on your attention is
        that interviewers ask about it.
      </p>
      <CodeBlock language="java" filename="stacks and queues" code={deque} />

      <CommonMistake
        title="modifying the list a subList view points at"
        wrong={`List<String> all = new ArrayList<>(List.of("a", "b", "c", "d"));
List<String> middle = all.subList(1, 3);

all.add("e");                    // structural change to the backing list
System.out.println(middle);      // ConcurrentModificationException`}
        right={`// Take a copy when you want an independent list
List<String> middle = new ArrayList<>(all.subList(1, 3));
all.add("e");
System.out.println(middle);      // [b, c]

// Or use the view deliberately, for its write-through behaviour:
all.subList(1, 3).clear();       // removes b and c from 'all'`}
        explanation={
          <p>
            <code>subList</code> returns a <em>view</em> onto the original list, not a copy. Writes through the view
            affect the original — which is genuinely useful for bulk removal — but any structural change to the
            original invalidates the view. If you want a snapshot, wrap it in a new <code>ArrayList</code>.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A list keeps things in order and lets you ask for the item at a position. <code>ArrayList</code> is the
            one to use: it's backed by an array, so getting item number 5 is instant. It grows automatically when
            it runs out of room, by making a bigger array and copying.
          </p>
        }
        developer={
          <p>
            <code>ArrayList</code> wraps an <code>Object[]</code> that grows by 50% via{" "}
            <code>System.arraycopy</code>, giving amortised O(1) append and O(1) random access.{" "}
            <code>LinkedList</code> is a doubly-linked list: O(1) structural change at a held position but O(n)
            indexing and poor cache behaviour, since each node is a separate heap object. Both are fail-fast on
            concurrent modification. <code>subList</code>, <code>Arrays.asList</code> and{" "}
            <code>Collections.unmodifiableList</code> all return views over existing storage.
          </p>
        }
        interview={
          <p>
            The classic is <code>ArrayList</code> vs <code>LinkedList</code>. Give the complexity table, then the
            more valuable point: memory locality means <code>ArrayList</code> usually wins even for middle inserts,
            because a bulk <code>arraycopy</code> beats chasing pointers to find the position. Extras that land
            well: the growth factor and pre-sizing, the <code>remove(int)</code> versus{" "}
            <code>remove(Object)</code> trap, and that <code>ArrayDeque</code> supersedes both{" "}
            <code>Stack</code> and <code>LinkedList</code> for queue duties.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="You need to repeatedly insert elements at the front of a large collection. Which is the best choice?"
        options={[
          { id: "a", text: "ArrayList — insertion is always amortised O(1)" },
          { id: "b", text: "ArrayDeque — addFirst is O(1) and it has good cache behaviour" },
          { id: "c", text: "java.util.Stack, which is designed for this" },
          { id: "d", text: "TreeSet, which keeps things ordered" },
        ]}
        correctId="b"
        explanation="ArrayList.add(0, e) shifts every element, so it is O(n) per insert. ArrayDeque is a circular array with O(1) at both ends and contiguous storage, beating LinkedList too. Stack is a legacy synchronised class built on Vector and should not be used in new code."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Measure the myth"
        hint={
          <p>
            Time <code>add(0, e)</code> a hundred thousand times on each, then time summing every element by index,
            then by iterator. Warm up first.
          </p>
        }
      >
        Benchmark <code>ArrayList</code> against <code>LinkedList</code> for three operations: inserting at the
        front, reading by index, and iterating. Predict the winner for each first. At least one result will not
        match the complexity table — work out why, and you'll have learned something the table can't teach.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="When would you use LinkedList instead of ArrayList?"
        answer={
          <p>
            Honestly, almost never. The textbook answer is heavy insertion and removal in the middle, where{" "}
            <code>LinkedList</code> is O(1) against <code>ArrayList</code>'s O(n) shift — but that only holds if you
            already have an <code>Iterator</code> positioned there. If you have to reach the position by index,
            walking the chain is O(n) and you've lost the advantage. In practice <code>ArrayList</code> usually wins
            anyway: its elements are contiguous, so iteration is cache-friendly and a shift is one bulk memory move,
            whereas each <code>LinkedList</code> node is a separate object with a header and two pointers, scattered
            across the heap. <code>LinkedList</code> also implements <code>Deque</code>, but{" "}
            <code>ArrayDeque</code> is faster for that too. So: default to <code>ArrayList</code>, and switch only
            with a measurement in hand.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "ArrayList is the default: O(1) get, amortised O(1) append, cache-friendly iteration.",
          "It grows by ~50% and copies; pre-size with new ArrayList<>(n) when you know the size.",
          "remove(int) and remove(Object) are different methods — a real hazard with List<Integer>.",
          "subList, Arrays.asList and unmodifiable wrappers are views, not copies.",
          "Use ArrayDeque for stacks and queues; avoid java.util.Stack and rarely reach for LinkedList.",
        ]}
      />
    </>
  )
}
