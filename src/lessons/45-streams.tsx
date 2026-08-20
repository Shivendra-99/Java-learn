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
import { Filter, Play, Repeat, Shuffle, Waves } from "lucide-react"

const beforeAfter = `// The loop: how to do it
List<String> names = new ArrayList<>();
for (Order order : orders) {
    if (order.total() > 100) {
        names.add(order.customer().name().toUpperCase());
    }
}
Collections.sort(names);

// The stream: what you want
List<String> names = orders.stream()
        .filter(order -> order.total() > 100)
        .map(order -> order.customer().name().toUpperCase())
        .sorted()
        .toList();`

const anatomy = `source          .intermediate operations.          terminal operation
orders.stream() .filter(...).map(...).sorted()      .toList()

- A SOURCE produces elements: a collection, an array, a file, a generator.
- INTERMEDIATE operations return a new stream and do nothing yet — they are lazy.
- A TERMINAL operation triggers the work and produces a result or a side effect.

No terminal operation means nothing runs at all:
Stream<Order> s = orders.stream().filter(o -> { System.out.println("!"); return true; });
// prints nothing`

const sources = `list.stream();
Arrays.stream(array);
Stream.of("a", "b", "c");
IntStream.range(0, 10);              // 0..9
IntStream.rangeClosed(1, 10);        // 1..10
Files.lines(path);                   // must be closed
Stream.iterate(1, n -> n * 2).limit(10);       // infinite, then bounded
Stream.generate(Math::random).limit(5);
random.ints(10, 0, 100).boxed();`

const intermediate = `.filter(o -> o.isPaid())              keep matching elements
.map(Order::total)                    transform each element
.flatMap(order -> order.items().stream())   flatten nested structures
.distinct()                           remove duplicates (uses equals)
.sorted()  /  .sorted(comparator)     order — needs to see everything first
.limit(10)  /  .skip(5)               truncate
.peek(System.out::println)            look without changing — for DEBUGGING only
.takeWhile(o -> o.total() < 100)      Java 9+: stop at the first failure
.dropWhile(o -> o.total() < 100)      Java 9+: skip until the first failure`

const terminal = `.toList()                             Java 16+, immutable result
.collect(Collectors.toList())         the older, more flexible form
.forEach(System.out::println)         side effects, returns nothing
.count()
.anyMatch(p) / .allMatch(p) / .noneMatch(p)     short-circuiting booleans
.findFirst() / .findAny()             returns Optional
.min(cmp) / .max(cmp)                 returns Optional
.reduce(0, Integer::sum)              fold to a single value
.sum() / .average()                   on IntStream / LongStream / DoubleStream only`

const laziness = `List<String> words = List.of("apple", "banana", "cherry", "date");

Optional<String> first = words.stream()
        .peek(w -> System.out.println("peek:   " + w))
        .filter(w -> { System.out.println("filter: " + w); return w.length() > 5; })
        .findFirst();

// peek:   apple
// filter: apple          <- apple fails
// peek:   banana
// filter: banana         <- banana passes, and we STOP
//
// cherry and date are never touched. Elements flow through the whole
// pipeline one at a time, not stage by stage over the whole collection.`

const flatMapDemo = `// map when each element becomes one element
List<String> names = orders.stream().map(Order::reference).toList();

// flatMap when each element becomes MANY, and you want them flat
List<Item> allItems = orders.stream()
        .flatMap(order -> order.items().stream())
        .toList();

// With map you would get List<List<Item>> — nested, and rarely what you want.

// Also useful for filtering out empties:
List<String> present = optionals.stream()
        .flatMap(Optional::stream)         // Java 9+
        .toList();`

const reusePredictor = `import java.util.*;
import java.util.stream.*;

public class Reuse {
    public static void main(String[] args) {
        Stream<String> stream = Stream.of("a", "b", "c");
        long first = stream.count();
        long second = stream.count();
        System.out.println(first + " " + second);
    }
}`

export default function StreamsLesson() {
  return (
    <>
      <p>
        A stream is a pipeline for processing a sequence of elements. The shift it asks for is describing{" "}
        <em>what</em> you want rather than <em>how</em> to loop — and once the shape is familiar, most data-shuffling
        code becomes shorter and considerably harder to get wrong.
      </p>

      <h2>Loop versus stream</h2>
      <CodeBlock language="java" filename="the same result" code={beforeAfter} />
      <p>
        Note what disappeared: the mutable accumulator, the manual add, and the separate sort step. What remains
        reads as a sentence — filter, map, sort, collect.
      </p>

      <h2>Anatomy of a pipeline</h2>
      <CodeBlock language="text" filename="source, intermediates, terminal" code={anatomy} />

      <StepFlowDiagram
        title="How one element travels through the pipeline"
        steps={[
          {
            id: "source",
            label: "Source emits",
            detail: "The collection hands over one element. Nothing has been copied — a stream is a view over the source, not a container.",
            icon: Waves,
          },
          {
            id: "filter",
            label: "filter",
            detail: "The predicate runs on that single element. If it fails, the element is dropped immediately and the next one is pulled — the later stages never see it.",
            icon: Filter,
          },
          {
            id: "map",
            label: "map",
            detail: "The surviving element is transformed, still on its own. There is no intermediate list of filtered elements anywhere.",
            icon: Shuffle,
          },
          {
            id: "next",
            label: "Repeat per element",
            detail:
              "Each element goes all the way through before the next starts. That is why a short-circuiting terminal such as findFirst can stop after examining two of a million elements.",
            icon: Repeat,
            tone: "warning",
          },
          {
            id: "terminal",
            label: "Terminal collects",
            detail:
              "The terminal operation is what starts all of the above and produces the result. Without one, the intermediate calls have merely built a description of work that never runs.",
            icon: Play,
            tone: "success",
          },
        ]}
      />

      <AnalogyCard title="A conveyor belt with inspectors, not four passes down the line.">
        You might imagine every item being filtered, then the survivors all being painted, then all being packed —
        three separate passes. It isn't. One item travels the whole belt: inspected, painted, packed, then the next
        starts. That's why the belt can stop the moment you've found what you needed, and why nothing is ever piled
        up between stations.
      </AnalogyCard>

      <h2>Sources</h2>
      <CodeBlock language="java" filename="where streams come from" code={sources} />

      <h2>Intermediate operations</h2>
      <CodeBlock language="java" filename="lazy, and return a new stream" code={intermediate} />

      <h2>Terminal operations</h2>
      <CodeBlock language="java" filename="these actually run the pipeline" code={terminal} />

      <h2>Laziness, demonstrated</h2>
      <CodeBlock language="java" filename="element by element" code={laziness} />
      <Callout variant="info" title="Why laziness matters">
        It means <code>.filter(...).findFirst()</code> on a million-element list can stop after two, and that{" "}
        <code>Stream.iterate(...).limit(10)</code> on an infinite source terminates. It also means{" "}
        <code>peek</code> may not run for every element — which is exactly why <code>peek</code> is a debugging
        tool and not a place for side effects.
      </Callout>

      <h2>map versus flatMap</h2>
      <CodeBlock language="java" filename="one-to-one and one-to-many" code={flatMapDemo} />

      <h2>A stream is single-use</h2>
      <OutputPredictor
        code={reusePredictor}
        options={[
          { id: "a", text: "3 3" },
          { id: "b", text: "3 0" },
          { id: "c", label: "It throws IllegalStateException: stream has already been operated upon or closed", text: "" },
          { id: "d", label: "It does not compile", text: "" },
        ]}
        correctId="c"
        explanation={
          <p>
            A stream is consumed by its terminal operation and cannot be reused — it isn't a collection, it's a
            one-pass pipeline over a source. If you need two results, either run two pipelines from the source
            collection, or capture the elements once into a list. The exception is loud and immediate, which is
            better than silently returning zero.
          </p>
        }
      />

      <CommonMistake
        title="mutating an external collection inside a stream"
        wrong={`List<String> results = new ArrayList<>();
orders.stream()
      .filter(Order::isPaid)
      .forEach(o -> results.add(o.reference()));

// Works by accident sequentially; corrupts or loses data
// the moment anyone adds .parallel(), because ArrayList
// is not thread-safe.`}
        right={`List<String> results = orders.stream()
        .filter(Order::isPaid)
        .map(Order::reference)
        .toList();

// The pipeline produces the collection — no shared mutable state,
// and parallel() remains a safe one-word change.`}
        explanation={
          <p>
            Collecting by side effect throws away the main safety property of streams. The <code>collect</code> and{" "}
            <code>toList</code> terminals exist precisely to accumulate results, and they do so in a way that stays
            correct in parallel. Keep pipelines free of side effects and the parallel question becomes a
            performance decision rather than a correctness risk.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A stream lets you describe a sequence of steps over a collection — keep these, change those, sort, and
            give me the result — instead of writing the loop yourself. Nothing happens until the last step, and each
            element goes through all the steps before the next one starts.
          </p>
        }
        developer={
          <p>
            Streams are lazy: intermediate operations build a pipeline of stages and only a terminal operation
            drives it. Elements are pushed through one at a time, so short-circuiting works and no intermediate
            collections are created — except for <em>stateful</em> operations like <code>sorted</code> and{" "}
            <code>distinct</code>, which must buffer. Streams are single-use, don't modify their source, and
            shouldn't have side effects. Primitive streams (<code>IntStream</code> and friends) avoid boxing and add{" "}
            <code>sum</code> and <code>average</code>.
          </p>
        }
        interview={
          <p>
            Reliable questions: intermediate versus terminal, and why nothing runs without a terminal;{" "}
            <code>map</code> versus <code>flatMap</code>; and why a stream can't be reused. Good extras: which
            operations are stateful and therefore break the one-element-at-a-time model, why{" "}
            <code>peek</code> is unreliable for side effects, and when <code>parallel()</code> is actually worth it
            (large data, cheap independent operations, a splittable source — rarely a{" "}
            <code>LinkedList</code> or an I/O-bound task).
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What happens when you call orders.stream().filter(...).map(...) and nothing else?"
        options={[
          { id: "a", text: "The filter and map run over every element and the results are discarded" },
          { id: "b", text: "Nothing runs at all — intermediate operations are lazy and need a terminal operation" },
          { id: "c", text: "It throws IllegalStateException" },
          { id: "d", text: "Only the filter runs" },
        ]}
        correctId="b"
        explanation="Intermediate operations only build up a description of the pipeline. That laziness is what makes short-circuiting and infinite streams possible — and it's why a pipeline with no terminal operation is a silent no-op, a genuine source of 'my code does nothing' bugs."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Prove the pipeline runs element by element"
        hint={
          <p>
            Put a <code>System.out.println</code> inside both the <code>filter</code> and the <code>map</code>{" "}
            lambdas, then compare the output with <code>findFirst()</code> versus <code>toList()</code>.
          </p>
        }
      >
        Build a pipeline over five elements with printing in every stage, and run it once ending in{" "}
        <code>toList()</code> and once in <code>findFirst()</code>. Show that the interleaving proves elements
        traverse the whole pipeline individually, and that the second version stops early. Then insert{" "}
        <code>sorted()</code> in the middle and explain why the interleaving changes.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between intermediate and terminal operations, and why does it matter?"
        answer={
          <p>
            Intermediate operations — <code>filter</code>, <code>map</code>, <code>sorted</code>,{" "}
            <code>limit</code> — return a new <code>Stream</code> and are <strong>lazy</strong>: calling one
            performs no work, it just adds a stage to the pipeline. Terminal operations —{" "}
            <code>collect</code>, <code>forEach</code>, <code>count</code>, <code>findFirst</code>,{" "}
            <code>reduce</code> — produce a result or a side effect and are what actually drive execution. The
            distinction matters for three reasons. First, a pipeline with no terminal operation does nothing at all,
            silently. Second, laziness enables short-circuiting: <code>findFirst</code> or <code>anyMatch</code>{" "}
            after a <code>filter</code> can stop after a handful of elements rather than processing the whole
            source, and it makes infinite streams usable with <code>limit</code>. Third, elements are pushed through
            the whole pipeline one at a time rather than stage by stage, so no intermediate collections are
            allocated — except for stateful operations such as <code>sorted</code> and <code>distinct</code>, which
            necessarily buffer.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A pipeline is source, intermediate operations (lazy), and one terminal operation (which runs it).",
          "No terminal operation means nothing executes — a silent no-op.",
          "Elements flow one at a time, which is what enables short-circuiting and infinite sources.",
          "map is one-to-one, flatMap is one-to-many-then-flatten.",
          "Streams are single-use and should have no side effects — accumulate with collect, not forEach.",
        ]}
      />
    </>
  )
}
