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
import { Hash, Search, ListChecks, CircleCheck, Boxes } from "lucide-react"

const inherited = `// What Object gives every class, unhelpfully
public boolean equals(Object other) {
    return this == other;          // identity only
}

public int hashCode() {
    // derived from the object's memory identity
}

public String toString() {
    return getClass().getName() + "@" + Integer.toHexString(hashCode());
    // e.g. "com.example.Point@6d06d69c"
}`

const brokenSet = `import java.util.*;

public class Broken {
    static class Point {
        final int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }

        @Override
        public boolean equals(Object o) {
            if (!(o instanceof Point p)) return false;
            return x == p.x && y == p.y;
        }
        // hashCode deliberately NOT overridden
    }

    public static void main(String[] args) {
        Set<Point> set = new HashSet<>();
        set.add(new Point(1, 2));
        System.out.println(set.contains(new Point(1, 2)));
    }
}`

const correct = `public final class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;                  // fast path for identity
        if (!(o instanceof Point other)) return false; // handles null too
        return x == other.x && y == other.y;         // compare the fields that define identity
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);                   // same fields, same order
    }

    @Override
    public String toString() {
        return "Point[x=" + x + ", y=" + y + "]";
    }
}

// Or let the compiler write all three:
public record Point(int x, int y) { }`

const contract = `The equals contract — for any non-null references x, y, z:

  reflexive     x.equals(x) is true
  symmetric     x.equals(y) == y.equals(x)
  transitive    x.equals(y) && y.equals(z)  implies  x.equals(z)
  consistent    repeated calls give the same answer while nothing changes
  null-safe     x.equals(null) is false, never a NullPointerException

The hashCode contract:

  1. Equal objects MUST have equal hash codes.
  2. Unequal objects MAY share a hash code (a collision) — that is allowed,
     and only costs performance.
  3. The hash must not change while the object sits in a hash-based collection.

Rule 1 is the one that breaks HashMap and HashSet when you forget it.`

const objectsHelpers = `import java.util.Objects;

Objects.equals(a, b)         // true if both null, else a.equals(b) — never throws
Objects.hash(x, y, z)        // combined hash of several fields (boxes into an array)
Objects.hashCode(a)          // 0 if null, else a.hashCode()
Objects.toString(a, "none")  // "none" if a is null
Objects.requireNonNull(a, "a required")   // fail fast, with a message

// For a single field, prefer the specific method — no array allocation:
Integer.hashCode(x)          // instead of Objects.hash(x)`

const getClassVsInstanceof = `// instanceof: a subclass instance can equal a superclass instance
if (!(o instanceof Point p)) return false;
// Risk: asymmetry if a subclass adds fields to the comparison.

// getClass: only exactly the same class can ever be equal
if (o == null || getClass() != o.getClass()) return false;
// Risk: a proxy or a trivially-extending subclass never equals the original.

// The practical rule: make value classes final (or use records)
// and the question stops mattering.`

export default function ObjectMethodsLesson() {
  return (
    <>
      <p>
        Every class inherits <code>equals</code>, <code>hashCode</code> and <code>toString</code> from{" "}
        <code>Object</code>, and all three inherited versions are close to useless for your own types. Overriding
        them correctly — especially the first two <em>together</em> — is the difference between collections that
        work and collections that silently lose your data.
      </p>

      <h2>What you inherit</h2>
      <CodeBlock language="java" filename="Object's defaults" code={inherited} />
      <p>
        The default <code>equals</code> is <code>==</code>: two objects are equal only if they're the same object.
        For a <code>Point(1, 2)</code>, that's almost never what you want.
      </p>

      <h2>What goes wrong when you override only one</h2>
      <OutputPredictor
        code={brokenSet}
        options={[
          { id: "a", text: "true" },
          { id: "b", text: "false" },
          { id: "c", label: "It does not compile", text: "" },
          { id: "d", label: "It throws at runtime", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>HashSet</code> finds candidates by hash code <em>first</em>. The two points are equal by{" "}
            <code>equals</code>, but their inherited <code>hashCode</code> values are based on identity and differ,
            so the lookup goes to a different bucket and never even calls <code>equals</code>. The object is in the
            set and cannot be found — which is exactly why the rule is "override both, always, using the same
            fields".
          </p>
        }
      />

      <h2>How a hash lookup actually works</h2>
      <StepFlowDiagram
        title="set.contains(point) step by step"
        steps={[
          {
            id: "hash",
            label: "Call hashCode()",
            detail: "The set asks the object you passed in for its hash code. This is the only thing that decides where to look.",
            icon: Hash,
          },
          {
            id: "bucket",
            label: "Pick a bucket",
            detail:
              "The hash is spread and reduced to an index in the internal table. Two objects with different hashes almost always land in different buckets.",
            icon: Boxes,
          },
          {
            id: "scan",
            label: "Scan that bucket only",
            detail:
              "Only the entries already in that one bucket are examined. Anything stored elsewhere is invisible to this lookup — no matter how equal it is.",
            icon: Search,
            tone: "warning",
          },
          {
            id: "equals",
            label: "Call equals() on candidates",
            detail: "For each entry in the bucket, equals decides whether it is really a match. Collisions are resolved here, correctly but more slowly.",
            icon: ListChecks,
          },
          {
            id: "result",
            label: "Answer",
            detail:
              "Found means an entry in the right bucket returned true from equals. Skip the hash contract and step 3 sends you to the wrong bucket, so step 4 never gets the chance.",
            icon: CircleCheck,
            tone: "success",
          },
        ]}
      />

      <h2>The contracts</h2>
      <CodeBlock language="text" filename="what you are promising" code={contract} />

      <AnalogyCard title="A library's shelf number and its catalogue entry.">
        The hash code is the shelf; equals is checking the title once you're there. Two copies of the same book must
        be filed on the same shelf, or the second one is lost — present in the building, unfindable by anyone
        looking properly. Different books sharing a shelf is fine: you just read a few spines. That asymmetry is
        precisely the hashCode contract.
      </AnalogyCard>

      <h2>Writing them correctly</h2>
      <CodeBlock language="java" filename="Point.java" code={correct} />
      <CodeBlock language="java" filename="java.util.Objects" code={objectsHelpers} />

      <Callout variant="tip" title="Let the tools write them">
        Records generate all three from the components, correctly. Failing that, your IDE generates them, and
        Lombok's <code>@EqualsAndHashCode</code> does too. Hand-written versions drift when someone adds a field —
        which is the most common way a correct implementation becomes an incorrect one.
      </Callout>

      <h2>instanceof or getClass?</h2>
      <CodeBlock language="java" filename="the perennial argument" code={getClassVsInstanceof} />

      <CommonMistake
        title="a mutable field used in hashCode"
        wrong={`class Order {
    private String status;             // mutable
    @Override public int hashCode() {
        return Objects.hash(status);   // hash changes when status does
    }
}

Set<Order> orders = new HashSet<>();
orders.add(order);
order.setStatus("SHIPPED");
orders.contains(order);   // false — it is in the set, in the wrong bucket`}
        right={`class Order {
    private final String id;           // immutable identity
    private String status;             // mutable state, NOT part of identity

    @Override public int hashCode() { return id.hashCode(); }
    @Override public boolean equals(Object o) {
        return o instanceof Order other && id.equals(other.id);
    }
}`}
        explanation={
          <p>
            An object's hash must not change while it's in a hash-based collection, because the collection filed it
            under the old value and never re-checks. Base equality on a stable identity — an id, or fields that are{" "}
            <code>final</code> — and leave changeable state out of it. This is also why immutable types make the
            best map keys.
          </p>
        }
      />

      <h2>toString earns its place too</h2>
      <p>
        <code>toString</code> has no contract, but it has a purpose: it's what appears in your logs and your
        debugger. <code>Order@6d06d69c</code> tells you nothing at 3am;{" "}
        <code>Order[id=A-1, status=PAID]</code> tells you everything. Include the fields that identify the object,
        and never include secrets — passwords and tokens end up in log files this way.
      </p>

      <DifficultyLevels
        simple={
          <p>
            By default, Java thinks two objects are equal only if they're literally the same object. To make two
            objects with the same contents count as equal, you write <code>equals</code> — and you must also write{" "}
            <code>hashCode</code>, because sets and maps use it to decide where to look. Override one without the
            other and things go missing.
          </p>
        }
        developer={
          <p>
            <code>HashMap</code> spreads your hash (<code>h ^ (h &gt;&gt;&gt; 16)</code>), masks it to a bucket
            index, then compares candidates with <code>==</code> and <code>equals</code>. Equal objects with
            different hashes therefore land in different buckets and are never compared. Use the same fields for
            both methods, keep them immutable, and prefer <code>Objects.hash</code> for several fields or the
            type-specific <code>hashCode</code> for one. Records generate correct implementations from their
            components.
          </p>
        }
        interview={
          <p>
            This is one of the most-asked Java topics. Know the contract verbatim, know that unequal objects{" "}
            <em>may</em> collide, and be ready to explain exactly what breaks with a set or map when only{" "}
            <code>equals</code> is overridden. Strong extras: why mutable fields must stay out of{" "}
            <code>hashCode</code>, the <code>instanceof</code>-versus-<code>getClass</code> symmetry argument, and
            that returning a constant from <code>hashCode</code> is <em>legal</em> but degrades every hash bucket to
            a linked list.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Two objects are unequal but return the same hashCode. What is the consequence?"
        options={[
          { id: "a", text: "The hashCode contract is violated" },
          { id: "b", text: "Nothing incorrect happens — they share a bucket and equals tells them apart" },
          { id: "c", text: "HashMap will overwrite one with the other" },
          { id: "d", text: "It throws IllegalStateException" },
        ]}
        correctId="b"
        explanation="Collisions are explicitly permitted; only the reverse — equal objects with different hashes — is a violation. A collision costs a little lookup time because more entries in the bucket must be compared, and nothing more."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Lose an object inside a HashMap"
        hint={
          <p>
            Give the key class a mutable field, include it in <code>hashCode</code>, put the key in the map, then
            change the field.
          </p>
        }
      >
        Build a <code>HashMap</code> whose key class includes a mutable field in its hash. Insert an entry, mutate
        the key, and demonstrate that <code>get</code> now returns null while <code>size()</code> still says 1 —
        and that iterating the map still shows the entry. Then fix it by basing equality on an immutable id.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the contract between equals and hashCode, and what breaks if you ignore it?"
        answer={
          <p>
            The contract is: objects that are equal by <code>equals</code> must return the same{" "}
            <code>hashCode</code>; unequal objects may share one; and an object's hash must stay stable while it's
            used as a key. What breaks is every hash-based collection. <code>HashMap</code> and{" "}
            <code>HashSet</code> locate entries by hash first, so if you override <code>equals</code> alone, two
            equal objects get identity-based hashes, land in different buckets, and <code>equals</code> is never
            invoked — <code>contains</code> returns false for an element that is definitely in the set, and{" "}
            <code>put</code> creates a duplicate key. The same failure occurs if a field used in the hash is mutated
            after insertion, since the collection filed the entry under the old value. The fix in both cases is to
            derive both methods from the same immutable fields, or to use a record.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Object's equals is identity comparison and its toString is a hash — override both for value types.",
          "Override equals and hashCode together, from the same fields, or hash-based collections lose entries.",
          "Equal objects must share a hash code; unequal objects may collide, which only costs speed.",
          "Never derive a hash from mutable state, and never mutate a key while it's in a map.",
          "Records generate correct equals, hashCode and toString for free — prefer them for value types.",
        ]}
      />
    </>
  )
}
