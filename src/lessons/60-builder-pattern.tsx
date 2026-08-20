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

const telescoping = `// The problem: many parameters, several optional. Constructors multiply.
public Pizza(Size size) { ... }
public Pizza(Size size, boolean cheese) { ... }
public Pizza(Size size, boolean cheese, boolean pepperoni) { ... }
public Pizza(Size size, boolean cheese, boolean pepperoni, boolean mushroom) { ... }

// The call site is unreadable — what do these booleans mean?
Pizza p = new Pizza(Size.LARGE, true, false, true);

// And you can't skip an optional one in the middle without adding
// yet another overload. This is the 'telescoping constructor'.`

const builder = `public class Pizza {
    private final Size size;              // required
    private final boolean cheese;         // optional
    private final boolean pepperoni;
    private final int mushrooms;

    private Pizza(Builder b) {            // private: only the builder constructs
        this.size = b.size;
        this.cheese = b.cheese;
        this.pepperoni = b.pepperoni;
        this.mushrooms = b.mushrooms;
    }

    public static Builder builder(Size size) {   // required arg on the entry point
        return new Builder(size);
    }

    public static class Builder {
        private final Size size;                 // required
        private boolean cheese = false;          // optional, with defaults
        private boolean pepperoni = false;
        private int mushrooms = 0;

        private Builder(Size size) { this.size = size; }

        public Builder cheese(boolean v)   { this.cheese = v; return this; }   // return this
        public Builder pepperoni(boolean v){ this.pepperoni = v; return this; }// enables chaining
        public Builder mushrooms(int n)    { this.mushrooms = n; return this; }

        public Pizza build() {
            if (mushrooms < 0) throw new IllegalArgumentException("mushrooms");
            return new Pizza(this);      // validation here, before the object exists
        }
    }
}`

const usage = `// Every value names itself; skip whichever optionals you like
Pizza p = Pizza.builder(Size.LARGE)
        .cheese(true)
        .mushrooms(2)
        .build();                    // pepperoni defaults to false

// Compare with the constructor it replaces:
Pizza p = new Pizza(Size.LARGE, true, false, 2);   // which arg was which?`

const jdkBuilders = `// You already use builders
StringBuilder sb = new StringBuilder()
        .append("id=").append(42).append(';');

HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://example.com"))
        .header("Accept", "application/json")
        .timeout(Duration.ofSeconds(10))
        .GET()
        .build();

Stream.Builder<String> stream = Stream.builder();
// ...and Stream.Builder, Locale.Builder, Calendar.Builder, and Lombok's @Builder.`

const predictor = `public class BuildIt {
    static class Box {
        final int w, h;
        private Box(Builder b) { w = b.w; h = b.h; }
        static Builder builder() { return new Builder(); }
        static class Builder {
            int w = 1, h = 1;
            Builder width(int v)  { w = v; return this; }
            Builder height(int v) { h = v; return this; }
            Box build() { return new Box(this); }
        }
    }

    public static void main(String[] args) {
        Box b = Box.builder().width(4).build();
        System.out.println(b.w + "x" + b.h);
    }
}`

export default function BuilderPatternLesson() {
  return (
    <>
      <p>
        The Builder pattern (creational) assembles an object step by step, so a type with many parameters —
        especially several optional ones — can be constructed readably. It's the cure for the telescoping
        constructor, and once again it's something you already use: <code>StringBuilder</code> is one.
      </p>

      <h2>The problem it solves</h2>
      <CodeBlock language="java" filename="telescoping constructors" code={telescoping} />

      <h2>A builder</h2>
      <CodeBlock language="java" filename="Pizza.java" code={builder} />
      <p>
        Three mechanics make it work. Each setter <strong>returns the builder</strong> (<code>return this</code>),
        which is what enables the fluent chain. The product's constructor is <strong>private</strong>, so the
        builder is the only way to create one. And <code>build()</code> is where <strong>validation</strong> lives,
        so an invalid object can never come into existence.
      </p>

      <h2>Reading at the call site</h2>
      <CodeBlock language="java" filename="every value is labelled" code={usage} />

      <OutputPredictor
        code={predictor}
        options={[
          { id: "a", text: "4x1" },
          { id: "b", text: "4x4" },
          { id: "c", text: "1x1" },
          { id: "d", label: "It does not compile", text: "" },
        ]}
        correctId="a"
        explanation={
          <p>
            <code>width(4)</code> sets w and returns the same builder; <code>height</code> is never called, so h
            keeps its default of 1. The builder's field defaults are exactly how optional parameters get sensible
            values without an overload for every combination — that's the whole point of the pattern.
          </p>
        }
      />

      <AnalogyCard title="A sandwich order, not a fixed menu number.">
        Ordering "a number 4" forces you to memorise what's on a number 4 and take all of it. Building your own —
        bread, then whatever fillings you want, skip the ones you don't — names every choice and lets you leave
        things out. The builder is the made-to-order counter; the telescoping constructor is the numbered menu with
        a separate number for every combination.
      </AnalogyCard>

      <h2>Builders in the JDK</h2>
      <CodeBlock language="java" filename="you already use these" code={jdkBuilders} />

      <Callout variant="tip" title="When a builder is overkill">
        For a type with a couple of required fields and nothing optional, a constructor or a record is clearer and
        shorter — a builder adds a whole inner class to read. The pattern earns its place at roughly four or more
        parameters, especially when several are optional or the same type (so positional constructors become
        ambiguous). Below that, it's ceremony.
      </Callout>

      <CommonMistake
        title="a builder that lets you build an invalid object"
        wrong={`Pizza p = Pizza.builder(Size.LARGE)
        .mushrooms(-3)          // negative, but nothing complains
        .build();               // ...and you get a broken Pizza

// The setter accepted it and build() didn't check.`}
        right={`public Pizza build() {
    if (mushrooms < 0) {
        throw new IllegalArgumentException("mushrooms must be >= 0");
    }
    return new Pizza(this);     // validate in build(), before the object exists
}`}
        explanation={
          <p>
            A builder's setters usually accept anything for fluency, so <code>build()</code> is the single choke
            point where invariants must be checked — before the product is constructed. Validating there means an
            invalid <code>Pizza</code> can never exist, which is the same guarantee a validating constructor gives,
            just moved to the one method that finalises the object.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            When a class has lots of settings, especially optional ones, a giant constructor full of arguments is
            unreadable. A builder lets you set them one at a time by name — <code>.cheese(true).mushrooms(2)</code> —
            and then call <code>build()</code>. You've used one: <code>StringBuilder</code>.
          </p>
        }
        developer={
          <p>
            Each mutator returns <code>this</code> for chaining; the product has a private constructor taking the
            builder; <code>build()</code> validates and constructs. It solves the telescoping-constructor problem
            and beats the JavaBeans set-everything approach, which leaves the object mutable and in a temporarily
            invalid state during construction. The cost is boilerplate — Lombok's <code>@Builder</code> or an IDE
            generates it — and it's overkill below a handful of parameters, where a constructor or record is
            clearer.
          </p>
        }
        interview={
          <p>
            Be ready to write one and name the three mechanics: setters return the builder, the product constructor
            is private, validation happens in <code>build()</code>. Contrast it with the telescoping constructor
            (unreadable, combinatorial overloads) and the JavaBeans pattern (mutable, invalid mid-construction). A
            good detail: the builder is where you enforce that required fields are supplied — put them on the
            builder's own constructor or the entry-point method, so they can't be forgotten.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What does 'return this' at the end of each builder setter enable?"
        options={[
          { id: "a", text: "It makes the builder thread-safe" },
          { id: "b", text: "Method chaining — each call returns the builder so the next can be appended" },
          { id: "c", text: "It validates the value being set" },
          { id: "d", text: "It constructs the final product" },
        ]}
        correctId="b"
        explanation="Returning the builder from each setter is what lets you write .cheese(true).mushrooms(2).build() as one fluent expression. Validation belongs in build(); construction happens there too. The chaining is purely a consequence of every setter handing the builder back."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Replace a four-boolean constructor"
        hint={
          <p>
            Give the builder sensible field defaults for the optional values, and put the one required field on the
            builder's constructor so it can't be skipped.
          </p>
        }
      >
        Take a class whose constructor has four or more parameters (bonus if several are the same type) and give it
        a builder. Confirm the call site now reads clearly, that optional values can be omitted, and that{" "}
        <code>build()</code> rejects an invalid combination. Then decide honestly whether the class was actually big
        enough to warrant it.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="When would you use the Builder pattern, and how does it beat the alternatives?"
        answer={
          <p>
            When a class has many construction parameters, particularly optional ones or several of the same type.
            The two alternatives both fall short. The <strong>telescoping constructor</strong> — one overload per
            combination of parameters — produces call sites full of unlabelled positional arguments (
            <code>new Pizza(LARGE, true, false, 2)</code>), forces a combinatorial explosion of overloads, and can't
            skip an optional parameter in the middle. The <strong>JavaBeans</strong> approach — a no-arg
            constructor plus setters — leaves the object mutable and, worse, temporarily invalid between the{" "}
            <code>new</code> and the last setter, so you can't make it immutable or thread-safe. The builder gives
            you readable, self-documenting construction where each value names itself, optional parameters get
            defaults, the product can be immutable because it's built in one shot, and <code>build()</code> is a
            single validation point that guarantees no invalid instance escapes. The trade-off is boilerplate, so
            for two or three fields a constructor or record is better — the builder pays off at roughly four or
            more.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Builder assembles an object step by step — the cure for telescoping constructors and unlabelled arguments.",
          "Three mechanics: setters return the builder, the product constructor is private, build() validates.",
          "Optional parameters get defaults on the builder, so you skip whichever you don't need.",
          "StringBuilder, HttpRequest.newBuilder and Stream.builder are builders you already use.",
          "It's overkill below ~4 parameters — a constructor or record is clearer there.",
        ]}
      />
    </>
  )
}
