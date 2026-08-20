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

const comparable = `// Comparable: the type's ONE natural ordering, built into the class
public record Version(int major, int minor) implements Comparable<Version> {

    @Override
    public int compareTo(Version other) {
        int byMajor = Integer.compare(major, other.major);
        return byMajor != 0 ? byMajor : Integer.compare(minor, other.minor);
    }
}

List<Version> versions = new ArrayList<>(...);
Collections.sort(versions);       // uses compareTo
versions.sort(null);              // same thing
new TreeSet<>(versions);          // sorted collections need it too`

const contract = `compareTo / compare must return:
   negative   this comes BEFORE other
   zero       they tie
   positive   this comes AFTER other

The contract:
  1. sgn(compare(a, b)) == -sgn(compare(b, a))         antisymmetric
  2. compare(a,b) > 0 && compare(b,c) > 0  =>  compare(a,c) > 0   transitive
  3. compare(a,b) == 0  =>  sgn(compare(a,c)) == sgn(compare(b,c))
  4. strongly recommended: compare(a,b) == 0 iff a.equals(b)

Break 1-3 and sorting throws:
  "Comparison method violates its general contract!"
Break 4 and TreeSet/TreeMap will behave oddly, but legally.`

const comparator = `// Comparator: any number of orderings, defined outside the class
Comparator<Employee> byName = Comparator.comparing(Employee::name);
Comparator<Employee> bySalaryDesc = Comparator.comparingLong(Employee::salary).reversed();

// Chaining — the reason nobody writes compare() by hand any more
Comparator<Employee> ordering = Comparator
        .comparing(Employee::department)
        .thenComparing(Employee::salary, Comparator.reverseOrder())
        .thenComparing(Employee::name);

employees.sort(ordering);

// Nulls
Comparator<Employee> safe = Comparator.nullsFirst(byName);
Comparator<Employee> nullNames = Comparator.comparing(
        Employee::name, Comparator.nullsLast(Comparator.naturalOrder()));`

const subtraction = `// WRONG: works until the numbers are large
Comparator<Item> bad = (a, b) -> a.value() - b.value();

// value() = 2_000_000_000 and -2_000_000_000
// 2_000_000_000 - (-2_000_000_000) overflows to a NEGATIVE number,
// so "much larger" compares as "smaller". The sort silently
// produces wrong output, or throws the contract violation.

// RIGHT:
Comparator<Item> good = Comparator.comparingInt(Item::value);
// or (a, b) -> Integer.compare(a.value(), b.value());`

const stability = `// Java's sort for objects is STABLE: equal elements keep their
// relative order. That is what makes multi-pass sorting work:

people.sort(Comparator.comparing(Person::firstName));
people.sort(Comparator.comparing(Person::lastName));
// -> sorted by last name, and within each last name still by first name

// (Prefer a single chained comparator — but the property is worth knowing.)

// Arrays.sort on PRIMITIVES uses dual-pivot quicksort and is NOT stable.
// Stability is meaningless for primitives, since equal values are
// indistinguishable.`

const sortPredictor = `import java.util.*;

public class Sorting {
    record P(String name, int age) { }

    public static void main(String[] args) {
        List<P> people = new ArrayList<>(List.of(
                new P("Cara", 30), new P("Ana", 25), new P("Ben", 30)));
        people.sort(Comparator.comparingInt(P::age).thenComparing(P::name));
        System.out.println(people.get(0).name() + people.get(1).name());
    }
}`

export default function SortingAndComparatorsLesson() {
  return (
    <>
      <p>
        Sorting in Java comes down to one question: does this type have a single obvious order, or several possible
        ones? A single one belongs inside the class, as <code>Comparable</code>. Several belong outside it, as{" "}
        <code>Comparator</code> objects you can build, combine and pass around.
      </p>

      <h2>Comparable: the natural ordering</h2>
      <CodeBlock language="java" filename="implementing Comparable" code={comparable} />
      <p>
        Implement it when there is one ordering nobody would dispute — numeric order for a version, chronological
        for a date, alphabetical for a name. Sorted collections such as <code>TreeSet</code> and{" "}
        <code>TreeMap</code> require either this or an explicit comparator.
      </p>

      <h2>The contract</h2>
      <CodeBlock language="text" filename="what you are promising" code={contract} />
      <Callout variant="warning" title="Comparison method violates its general contract!">
        This runtime exception means your comparator is inconsistent — <code>a &lt; b</code>, <code>b &lt; c</code>,
        but <code>a &gt; c</code>. Java's merge sort detects it rather than producing silently wrong output. The
        usual causes are subtraction overflow, a comparator that consults mutable state, or one that special-cases
        certain values.
      </Callout>

      <h2>Comparator: as many orderings as you like</h2>
      <CodeBlock language="java" filename="building comparators" code={comparator} />

      <OutputPredictor
        question="Who ends up first and second?"
        code={sortPredictor}
        options={[
          { id: "a", text: "AnaBen" },
          { id: "b", text: "AnaCara" },
          { id: "c", text: "BenCara" },
          { id: "d", text: "CaraAna" },
        ]}
        correctId="a"
        explanation={
          <p>
            Primary key is age, so Ana (25) comes first. Cara and Ben tie at 30, and the{" "}
            <code>thenComparing(P::name)</code> tiebreaker puts Ben before Cara. The result is Ana, Ben, Cara — and
            the first two names print as "AnaBen". Chaining like this is both clearer and safer than a hand-written{" "}
            <code>compare</code> with nested if statements.
          </p>
        }
      />

      <AnalogyCard title="Sorting a stack of CVs.">
        There's no single correct order for a pile of applications. By date received, by surname, by years of
        experience — each is valid, and which you want depends on what you're doing right now. That's a{" "}
        <code>Comparator</code>: a rule you pick up when you need it. <code>Comparable</code> is for things like
        dates, where asking "in what order?" has an obvious answer.
      </AnalogyCard>

      <h2>Never subtract</h2>
      <CodeBlock language="java" filename="the overflow trap" code={subtraction} />

      <h2>Stability</h2>
      <CodeBlock language="java" filename="equal elements keep their order" code={stability} />

      <CommonMistake
        title="sorting an immutable list"
        wrong={`List<String> names = List.of("Cara", "Ana", "Ben");
names.sort(Comparator.naturalOrder());
// UnsupportedOperationException

List<String> fromArray = Arrays.asList("Cara", "Ana");
fromArray.sort(...);            // this one works — fixed size, but writable`}
        right={`// Copy first
List<String> sorted = new ArrayList<>(names);
sorted.sort(Comparator.naturalOrder());

// Or produce a new sorted list with a stream
List<String> sorted = names.stream().sorted().toList();`}
        explanation={
          <p>
            <code>List.of</code> returns a genuinely immutable list, and <code>sort</code> mutates in place. Either
            copy into an <code>ArrayList</code> first, or use <code>stream().sorted()</code>, which produces a new
            list and leaves the original alone. Confusingly, <code>Arrays.asList</code> <em>can</em> be sorted,
            because it's fixed-size rather than immutable — sorting writes through into the backing array.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            To sort your own objects, Java needs to know how to compare two of them. Either the class says so once
            by implementing <code>Comparable</code>, or you hand a <code>Comparator</code> to the sort call. The
            comparison returns a negative number, zero, or a positive number.
          </p>
        }
        developer={
          <p>
            <code>Collections.sort</code> and <code>List.sort</code> delegate to <code>Arrays.sort</code>, which for
            objects uses TimSort — stable, adaptive, O(n log n) — and for primitives uses dual-pivot quicksort,
            which is not stable. <code>Comparator.comparing</code> plus <code>thenComparing</code> composes
            key extractors; use <code>comparingInt</code>/<code>comparingLong</code>/<code>comparingDouble</code>{" "}
            to avoid boxing. TimSort actively verifies the contract and throws{" "}
            <code>IllegalArgumentException</code> when it's violated.
          </p>
        }
        interview={
          <p>
            Expect <code>Comparable</code> vs <code>Comparator</code>: one natural ordering inside the class versus
            many orderings outside it, and the fact that you can write a comparator for a class you don't own.
            Strong extras: why subtraction-based comparators overflow, what "stable sort" means and why it enables
            multi-pass sorting, and why the contract recommends consistency with <code>equals</code> — a{" "}
            <code>TreeSet</code> treats a zero comparison as a duplicate regardless of <code>equals</code>.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is (a, b) -> a.getValue() - b.getValue() a dangerous comparator?"
        options={[
          { id: "a", text: "It is slower than Integer.compare" },
          { id: "b", text: "The subtraction can overflow for large or opposite-signed values, inverting the result" },
          { id: "c", text: "It returns a boolean rather than an int" },
          { id: "d", text: "It cannot be used with thenComparing" },
        ]}
        correctId="b"
        explanation="A large positive minus a large negative overflows int and wraps to negative, so the comparator claims the bigger value is smaller. The sort then either produces wrong output or throws the contract-violation exception. Integer.compare has no such failure mode."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Break the contract on purpose"
        hint={
          <p>
            Use values near <code>Integer.MAX_VALUE</code> and <code>Integer.MIN_VALUE</code>, and sort a list of at
            least 32 elements so TimSort's merge path actually runs.
          </p>
        }
      >
        Write a subtraction-based comparator and craft input that makes it produce an incorrect order or throw
        "Comparison method violates its general contract!". Then replace it with{" "}
        <code>Comparator.comparingInt</code> and confirm the same input sorts correctly. Keep the failing input —
        it's a good test case.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between Comparable and Comparator?"
        answer={
          <p>
            <code>Comparable</code> is implemented <em>by</em> the class and defines its single natural ordering
            through <code>compareTo(T other)</code> — it's what <code>Collections.sort(list)</code>,{" "}
            <code>TreeSet</code> and <code>TreeMap</code> use by default. <code>Comparator</code> is a separate
            object defining an ordering <em>for</em> a type through <code>compare(T a, T b)</code>, so you can have
            as many as you like, choose one per call site, and write one for a class you don't control or can't
            modify. In modern code you rarely implement either by hand:{" "}
            <code>Comparator.comparing(...).thenComparing(...)</code> composes key extractors and handles the
            tie-breaking for you. Both must obey the same contract — antisymmetric, transitive, consistent — and
            should ideally agree with <code>equals</code>, because a sorted collection treats a zero result as a
            duplicate.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Comparable is the one natural ordering, inside the class; Comparator is any ordering, outside it.",
          "Return negative, zero or positive — and obey antisymmetry and transitivity or TimSort will throw.",
          "Build comparators with Comparator.comparing / thenComparing / reversed rather than by hand.",
          "Never compare by subtraction — it overflows. Use Integer.compare or comparingInt.",
          "Object sorts are stable; List.of cannot be sorted in place, so copy or use stream().sorted().",
        ]}
      />
    </>
  )
}
