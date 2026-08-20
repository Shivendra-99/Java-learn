import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { ExecutionTrace } from "@/components/lesson/execution-trace"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { OutputPredictor } from "@/components/lesson/output-predictor"

const forms = `// for — when you know the bounds, or need the index
for (int i = 0; i < items.length; i++) {
    System.out.println(i + ": " + items[i]);
}

// for-each — when you just need each element
for (String item : items) {
    System.out.println(item);
}

// while — when the end condition isn't a simple count
while (scanner.hasNextLine()) {
    process(scanner.nextLine());
}

// do-while — when the body must run at least once
do {
    choice = prompt("Pick 1-3: ");
} while (choice < 1 || choice > 3);`

const anatomy = `for (int i = 0; i < 3; i++) { ... }
//   ^^^^^^^^^  ^^^^^  ^^^
//   1. init    2. test 3. update
//
// Order of execution:
//   init once, then: test -> body -> update -> test -> body -> update -> ...
//   The loop ends the first time the test is false.
//   If the test is false immediately, the body never runs at all.`

const trace = `public class Sum {
    public static void main(String[] args) {
        int[] prices = {10, 25, 5};
        int total = 0;
        for (int i = 0; i < prices.length; i++) {
            total += prices[i];
        }
        System.out.println("Total: " + total);
    }
}`

const offByOne = `public class Bounds {
    public static void main(String[] args) {
        String[] names = {"Ana", "Ben", "Cara"};
        for (int i = 0; i <= names.length; i++) {
            System.out.println(names[i]);
        }
    }
}`

const control = `// break — leave the loop entirely
for (Order order : orders) {
    if (order.isCancelled()) break;
    process(order);
}

// continue — skip to the next iteration
for (Order order : orders) {
    if (order.isCancelled()) continue;
    process(order);
}

// labelled break — leave an OUTER loop from inside an inner one
outer:
for (int row = 0; row < grid.length; row++) {
    for (int col = 0; col < grid[row].length; col++) {
        if (grid[row][col] == target) {
            found = true;
            break outer;      // plain break would only exit the inner loop
        }
    }
}`

const modify = `List<String> names = new ArrayList<>(List.of("Ana", "Ben", "Cara"));

// Throws ConcurrentModificationException
for (String name : names) {
    if (name.startsWith("B")) names.remove(name);
}

// Correct: removeIf says what you mean
names.removeIf(name -> name.startsWith("B"));

// Or use an explicit Iterator when the logic is more involved
Iterator<String> it = names.iterator();
while (it.hasNext()) {
    if (it.next().startsWith("B")) it.remove();
}`

export default function LoopsLesson() {
  return (
    <>
      <p>
        Four looping forms, and the choice between them is mostly about what you need to know while looping. Need
        the index? <code>for</code>. Just the elements? <code>for-each</code>. Don't know how many iterations
        there'll be? <code>while</code>. Need at least one pass no matter what? <code>do-while</code>.
      </p>

      <CodeBlock language="java" filename="the four forms" code={forms} />

      <h2>How a for loop actually runs</h2>
      <CodeBlock language="java" filename="anatomy" code={anatomy} />
      <p>
        The update runs <em>after</em> the body, not before — which is why <code>i</code> is 0 on the first pass.
        And the test runs before the first body execution, so a loop whose condition starts false runs zero times.
      </p>

      <ExecutionTrace
        title="Summing an array, iteration by iteration"
        filename="Sum.java"
        code={trace}
        steps={[
          { line: 3, vars: { prices: "[10, 25, 5]" }, note: "Array literal shorthand — allowed only at declaration." },
          { line: 4, vars: { total: "0" }, note: "The accumulator must be declared outside the loop, or it would reset each pass." },
          { line: 5, vars: { i: "0" }, note: "init runs once. The test 0 < 3 is true, so the body runs." },
          { line: 6, vars: { total: "10" }, note: "total += prices[0] — the first element added." },
          { line: 5, vars: { i: "1" }, note: "Update, then test again: 1 < 3 is true." },
          { line: 6, vars: { total: "35" }, note: "35 = 10 + 25." },
          { line: 5, vars: { i: "2" }, note: "2 < 3 is still true." },
          { line: 6, vars: { total: "40" }, note: "Last element added." },
          { line: 5, vars: { i: "3" }, note: "Now 3 < 3 is false, so the loop ends and i goes out of scope." },
          { line: 8, output: "Total: 40", note: "The classic accumulator pattern: declare outside, add inside, use after." },
        ]}
      />

      <h2>Off-by-one, the canonical loop bug</h2>
      <OutputPredictor
        code={offByOne}
        options={[
          { id: "a", text: "Ana\nBen\nCara" },
          { id: "b", label: "Prints three names, then throws ArrayIndexOutOfBoundsException", text: "Ana\nBen\nCara\nException in thread \"main\"..." },
          { id: "c", label: "It does not compile", text: "" },
          { id: "d", text: "Ana\nBen" },
        ]}
        correctId="b"
        explanation={
          <p>
            An array of length 3 has valid indices 0, 1, 2. The condition <code>i &lt;= names.length</code> allows{" "}
            <code>i</code> to reach 3, which is one past the end — so all three names print and then the fourth
            access throws. Use <code>&lt;</code> with <code>length</code>, or better, use a for-each loop where the
            bound cannot be got wrong.
          </p>
        }
      />

      <AnalogyCard title="Numbered seats and the number of seats.">
        A row of three seats is numbered 1, 2, 3 in a theatre — but 0, 1, 2 in Java. The count is three either way;
        the last valid index is one less than the count. Almost every off-by-one bug is this single sentence being
        forgotten, which is why <code>for-each</code> is preferable whenever you don't genuinely need the number.
      </AnalogyCard>

      <h2>break, continue, and labels</h2>
      <CodeBlock language="java" filename="loop control" code={control} />
      <p>
        Labelled breaks are the one feature here people are surprised Java has. They're rare, but the alternative —
        a boolean flag checked in both loop conditions — is worse. Note that a label goes on the loop, and{" "}
        <code>break label</code> exits <em>that</em> loop, it does not jump to the label.
      </p>

      <Callout variant="warning" title="Do not modify a collection while looping over it">
        Removing from a list inside a for-each loop throws <code>ConcurrentModificationException</code> — not
        because of threads, but because the iterator noticed the collection changed underneath it.
      </Callout>
      <CodeBlock language="java" filename="removing safely" code={modify} />

      <CommonMistake
        title="an accumulator declared inside the loop"
        wrong={`for (int i = 0; i < prices.length; i++) {
    int total = 0;          // reset every iteration
    total += prices[i];
}
// total isn't even in scope out here`}
        right={`int total = 0;              // declared once, outside
for (int i = 0; i < prices.length; i++) {
    total += prices[i];
}
System.out.println(total);`}
        explanation={
          <p>
            A variable declared inside the loop body is created fresh on every iteration and destroyed at the end of
            it. That's usually what you want for temporaries — and exactly wrong for a running total. The compiler
            catches this particular version because <code>total</code> isn't in scope afterwards, but the same
            mistake inside a nested loop compiles fine and quietly produces wrong numbers.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A loop repeats a block. Use <code>for</code> when counting, <code>for-each</code> when you just want
            every item, and <code>while</code> when you're waiting for something to become true. Remember that
            positions start at 0, so the last position is one less than the number of items.
          </p>
        }
        developer={
          <p>
            The enhanced for loop compiles to an index loop for arrays and to an <code>Iterator</code> loop for
            anything implementing <code>Iterable</code> — which is why you can't remove elements inside it, and why{" "}
            <code>removeIf</code> or an explicit <code>Iterator.remove</code> is the fix.{" "}
            <code>ConcurrentModificationException</code> comes from a modCount check, and it's best-effort: it
            detects the common cases, not all of them. Variables declared in the init clause are scoped to the loop.
          </p>
        }
        interview={
          <p>
            Two reliable questions. First, why for-each can't modify the collection — the iterator's{" "}
            <code>modCount</code> no longer matches the collection's, so the next <code>next()</code> fails fast.
            Second, when a plain <code>for</code> beats <code>for-each</code>: when you need the index, when you're
            iterating backwards, or when you're removing by index. Mentioning that for-each over an{" "}
            <code>ArrayList</code> and an indexed loop perform about the same, while for-each over a{" "}
            <code>LinkedList</code> is dramatically faster, shows you understand what it compiles to.
          </p>
        }
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Three ways to reverse"
        hint={
          <p>
            For the index loop, start at <code>length - 1</code> and count down while <code>i &gt;= 0</code>. For
            for-each, you'll need somewhere to collect the results before printing.
          </p>
        }
      >
        Print the elements of an array in reverse order three ways: with an index loop counting down, with a{" "}
        <code>while</code> loop, and with a for-each loop that builds a reversed copy first. Then note which one you
        would want to read in six months' time — that's usually the one to write.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why does removing an element inside a for-each loop throw ConcurrentModificationException?"
        answer={
          <p>
            The enhanced for loop over a collection is compiled into an <code>Iterator</code> loop. Collections such
            as <code>ArrayList</code> keep a <code>modCount</code> that increments on every structural change, and
            the iterator records that value when it's created. Calling <code>list.remove(...)</code> bumps the
            collection's count without touching the iterator's copy, so the next call to <code>next()</code> sees a
            mismatch and fails fast — the design assumes a stale iterator means a bug, and that failing immediately
            beats returning unpredictable results. The fixes are <code>Iterator.remove()</code>, which updates both
            counters, or <code>Collection.removeIf(...)</code>, which is clearer for a simple predicate. Note it's
            explicitly best-effort: it's a bug detector, not a guarantee.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "for when you need the index, for-each when you don't, while when the end isn't a count, do-while when the body must run once.",
          "Order in a for loop: init once, then test → body → update, repeating until the test fails.",
          "Indices run 0 to length - 1; use < length, never <= length.",
          "Accumulators are declared outside the loop; temporaries belong inside it.",
          "Never structurally modify a collection inside a for-each — use removeIf or Iterator.remove.",
        ]}
      />
    </>
  )
}
