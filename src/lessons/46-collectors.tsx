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

const basics = `import static java.util.stream.Collectors.*;

// To collections
stream.toList();                          // Java 16+, immutable
stream.collect(toList());                 // older, unspecified mutability
stream.collect(toCollection(TreeSet::new));   // pick the implementation
stream.collect(toSet());
stream.collect(toUnmodifiableList());

// To a String
names.stream().collect(joining());                  // "AnaBenCara"
names.stream().collect(joining(", "));              // "Ana, Ben, Cara"
names.stream().collect(joining(", ", "[", "]"));    // "[Ana, Ben, Cara]"

// Numbers
orders.stream().collect(counting());
orders.stream().collect(summingLong(Order::total));
orders.stream().collect(averagingDouble(Order::weight));
orders.stream().collect(summarizingLong(Order::total));   // count, sum, min, max, average`

const toMap = `// key extractor, value extractor
Map<String, Order> byReference = orders.stream()
        .collect(toMap(Order::reference, order -> order));

// Duplicate keys throw IllegalStateException — supply a merge function
Map<String, Long> totalByCustomer = orders.stream()
        .collect(toMap(Order::customerId, Order::total, Long::sum));

// Fourth argument: choose the map implementation
Map<String, Order> sorted = orders.stream()
        .collect(toMap(Order::reference, o -> o, (a, b) -> a, TreeMap::new));

// Careful: toMap throws NullPointerException on a null VALUE,
// unlike HashMap.put. Use groupingBy or filter the nulls out first.`

const grouping = `// The single most useful collector
Map<Status, List<Order>> byStatus = orders.stream()
        .collect(groupingBy(Order::status));

// With a downstream collector: what to do with each group
Map<Status, Long> countByStatus = orders.stream()
        .collect(groupingBy(Order::status, counting()));

Map<String, Long> revenueByCustomer = orders.stream()
        .collect(groupingBy(Order::customerId, summingLong(Order::total)));

Map<Status, List<String>> referencesByStatus = orders.stream()
        .collect(groupingBy(Order::status, mapping(Order::reference, toList())));

// Two levels of grouping
Map<String, Map<Status, List<Order>>> byCustomerThenStatus = orders.stream()
        .collect(groupingBy(Order::customerId, groupingBy(Order::status)));

// Choose the map type
Map<Status, List<Order>> ordered = orders.stream()
        .collect(groupingBy(Order::status, TreeMap::new, toList()));`

const partitioning = `// A special case of grouping with exactly two buckets, keyed by boolean
Map<Boolean, List<Order>> split = orders.stream()
        .collect(partitioningBy(order -> order.total() > 10_000));

List<Order> large = split.get(true);
List<Order> small = split.get(false);

// Unlike groupingBy, BOTH keys are always present — even if one
// list is empty. That is the reason to prefer it over groupingBy
// with a boolean classifier.`

const downstream = `counting()                       Long
summingInt/Long/Double(fn)       the total
averagingInt/Long/Double(fn)     Double
minBy(cmp) / maxBy(cmp)          Optional<T>
mapping(fn, downstream)          transform before collecting
filtering(pred, downstream)      Java 9+: filter within the group
flatMapping(fn, downstream)      Java 9+
collectingAndThen(c, finisher)   post-process the result
reducing(identity, op)
teeing(c1, c2, merger)           Java 12+: two collectors, one pass`

const collectingAndThen = `// Make the grouped lists immutable
Map<Status, List<Order>> byStatus = orders.stream()
        .collect(groupingBy(Order::status,
                 collectingAndThen(toList(), List::copyOf)));

// Find the highest-value order per customer, unwrapping the Optional
Map<String, Order> best = orders.stream()
        .collect(groupingBy(Order::customerId,
                 collectingAndThen(maxBy(comparingLong(Order::total)), Optional::get)));`

const groupingPredictor = `import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class Grouping {
    public static void main(String[] args) {
        List<String> words = List.of("apple", "avocado", "banana", "blueberry", "cherry");
        Map<Character, Long> counts = words.stream()
                .collect(groupingBy(w -> w.charAt(0), counting()));
        System.out.println(counts);
    }
}`

export default function CollectorsLesson() {
  return (
    <>
      <p>
        <code>collect</code> is the terminal operation that turns a stream back into data, and{" "}
        <code>Collectors</code> is a toolbox of ready-made recipes for doing so. Two of them —{" "}
        <code>groupingBy</code> and <code>toMap</code> — replace an enormous amount of loop-and-map code.
      </p>

      <h2>The straightforward ones</h2>
      <CodeBlock language="java" filename="collections, strings, numbers" code={basics} />

      <h2>toMap, and its sharp edges</h2>
      <CodeBlock language="java" filename="Collectors.toMap" code={toMap} />
      <Callout variant="warning" title="toMap throws on duplicate keys">
        The two-argument form has no idea what to do when two elements produce the same key, so it throws{" "}
        <code>IllegalStateException</code>. That's usually the right behaviour — a duplicate key is often a bug —
        but it means the two-argument form is only safe when you can guarantee uniqueness. Supply a merge function
        whenever you can't.
      </Callout>

      <h2>groupingBy</h2>
      <CodeBlock language="java" filename="the collector you will use most" code={grouping} />

      <OutputPredictor
        code={groupingPredictor}
        options={[
          { id: "a", text: "{a=2, b=2, c=1}" },
          { id: "b", text: "{a=[apple, avocado], b=[banana, blueberry], c=[cherry]}" },
          { id: "c", text: "{apple=2, banana=2, cherry=1}" },
          { id: "d", label: "It does not compile", text: "" },
        ]}
        correctId="a"
        explanation={
          <p>
            The classifier produces the first character, and the downstream <code>counting()</code> replaces the
            default <code>toList()</code> — so each group's value is a count rather than a list. The result map is a{" "}
            <code>HashMap</code>, and its <code>toString</code> happens to print the keys in this order because
            single characters hash to small values. Pass <code>TreeMap::new</code> if you need a guaranteed order.
          </p>
        }
      />

      <AnalogyCard title="Sorting the post into pigeonholes.">
        <code>groupingBy</code> is choosing which pigeonhole each letter goes in. The downstream collector is the
        instruction for what happens once it's there — pile them up (<code>toList</code>), count them (
        <code>counting</code>), add up the postage (<code>summingLong</code>), or open them and keep only the
        addresses (<code>mapping</code>). Two arguments, two independent decisions.
      </AnalogyCard>

      <h2>partitioningBy</h2>
      <CodeBlock language="java" filename="exactly two groups" code={partitioning} />

      <h2>Downstream collectors</h2>
      <CodeBlock language="text" filename="what can go in the second argument" code={downstream} />
      <CodeBlock language="java" filename="collectingAndThen" code={collectingAndThen} />

      <CommonMistake
        title="reimplementing groupingBy with forEach"
        wrong={`Map<String, List<Order>> byCustomer = new HashMap<>();
orders.forEach(order -> {
    byCustomer.computeIfAbsent(order.customerId(), k -> new ArrayList<>())
              .add(order);
});

// Correct, but it names a mutable map, mutates it from a lambda,
// and cannot be parallelised or composed.`}
        right={`Map<String, List<Order>> byCustomer = orders.stream()
        .collect(groupingBy(Order::customerId));

// And the variations come free:
Map<String, Long> counts = orders.stream()
        .collect(groupingBy(Order::customerId, counting()));`}
        explanation={
          <p>
            The manual version isn't wrong, and for a single simple grouping it's perfectly readable. It stops
            paying once you need a count, a sum, or a second level of grouping — each of which is a one-word change
            with <code>groupingBy</code> and another three lines by hand. It also relies on side effects, which
            makes it unsafe to parallelise.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            <code>collect</code> gathers the results of a stream into something you can use — a list, a string, or a
            map. <code>groupingBy</code> sorts elements into buckets by some property, and you can say what should
            happen to each bucket: keep the items, count them, or add something up.
          </p>
        }
        developer={
          <p>
            A <code>Collector</code> is a supplier, an accumulator, a combiner and a finisher, which is what allows{" "}
            <code>collect</code> to work correctly in parallel. <code>groupingBy</code> takes a classifier, an
            optional map factory, and a downstream collector defaulting to <code>toList()</code>; downstreams
            compose arbitrarily. <code>toMap</code> throws on duplicate keys without a merge function and on null
            values always. <code>partitioningBy</code> always produces both boolean keys, which{" "}
            <code>groupingBy</code> with a boolean classifier does not.
          </p>
        }
        interview={
          <p>
            Be able to write <code>groupingBy</code> with a downstream from memory —{" "}
            <code>groupingBy(Order::status, counting())</code> is the canonical example. Know the difference between{" "}
            <code>groupingBy</code> and <code>partitioningBy</code> (two guaranteed keys), and the two{" "}
            <code>toMap</code> hazards. If you can also explain the four parts of a <code>Collector</code>, you can
            answer "how would you write your own" without hesitating.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why prefer partitioningBy over groupingBy with a boolean classifier?"
        options={[
          { id: "a", text: "It is faster because it avoids autoboxing the keys" },
          { id: "b", text: "It guarantees both true and false keys exist, even when one group is empty" },
          { id: "c", text: "It returns a sorted map" },
          { id: "d", text: "groupingBy cannot take a boolean classifier" },
        ]}
        correctId="b"
        explanation="With groupingBy, a key only appears if at least one element produced it — so map.get(true) can return null and blow up a caller that assumed a list. partitioningBy always populates both keys with a list, empty if necessary. (It is also marginally faster, but the guaranteed keys are the reason to choose it.)"
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Build a small report with one pipeline"
        hint={
          <p>
            Two levels of grouping nest directly: <code>groupingBy(a, groupingBy(b, downstream))</code>. For the
            largest per group, <code>maxBy</code> returns an <code>Optional</code> — wrap with{" "}
            <code>collectingAndThen</code>.
          </p>
        }
      >
        From a list of orders, produce three results with streams alone: total revenue per customer, order counts
        per status, and the single largest order per customer. Then nest two of them so you get, per customer, a map
        of status to count. Write the equivalent with loops afterwards and compare the line counts.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How does Collectors.groupingBy work, and what is a downstream collector?"
        answer={
          <p>
            <code>groupingBy</code> takes a <em>classifier</em> function, applies it to every element, and builds a{" "}
            <code>Map</code> from each distinct classifier result to the elements that produced it. With one
            argument the values are <code>List</code>s, because the default downstream collector is{" "}
            <code>toList()</code>. The second argument lets you replace that: <code>counting()</code> gives group
            sizes, <code>summingLong(...)</code> gives totals, <code>mapping(fn, toList())</code> transforms
            elements before collecting, and another <code>groupingBy</code> produces a nested map. A three-argument
            form additionally takes a map factory, so you can get a <code>TreeMap</code> for sorted keys. The
            downstream mechanism is what makes collectors compose — each one is just a supplier, accumulator,
            combiner and finisher, so they can be nested arbitrarily and still work correctly in parallel.{" "}
            <code>partitioningBy</code> is the special case for a boolean classifier, and differs in guaranteeing
            both keys are present.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "collect turns a stream back into data; Collectors supplies the recipes.",
          "groupingBy(classifier, downstream) is the workhorse — counting, summing, mapping, or nesting.",
          "partitioningBy always produces both true and false keys; groupingBy only produces keys that occur.",
          "toMap throws on duplicate keys without a merge function, and on null values always.",
          "collectingAndThen post-processes a result — making lists immutable, or unwrapping an Optional.",
        ]}
      />
    </>
  )
}
