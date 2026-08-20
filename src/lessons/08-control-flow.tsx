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

const ifElse = `if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else if (score >= 70) {
    grade = "C";
} else {
    grade = "F";
}

// Order matters: the first matching branch wins and the rest are skipped.
// Writing these in ascending order would give everyone the lowest grade.`

const guardClause = `// Nested: the interesting code drifts right
public String describe(Order order) {
    if (order != null) {
        if (order.isPaid()) {
            if (order.hasItems()) {
                return "ready to ship";
            }
        }
    }
    return "not ready";
}

// Guard clauses: handle the exceptions first, then get on with it
public String describe(Order order) {
    if (order == null)      return "not ready";
    if (!order.isPaid())    return "not ready";
    if (!order.hasItems())  return "not ready";
    return "ready to ship";
}`

const oldSwitch = `switch (day) {
    case MONDAY:
    case TUESDAY:
    case WEDNESDAY:
    case THURSDAY:
    case FRIDAY:
        System.out.println("Weekday");
        break;              // without this, execution falls into the next case
    case SATURDAY:
    case SUNDAY:
        System.out.println("Weekend");
        break;
    default:
        System.out.println("Unknown");
}`

const newSwitch = `// Java 14+: arrow labels, no fall-through, no break needed
switch (day) {
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> System.out.println("Weekday");
    case SATURDAY, SUNDAY -> System.out.println("Weekend");
}

// As an expression, it produces a value
String type = switch (day) {
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "Weekday";
    case SATURDAY, SUNDAY -> "Weekend";
};

// A block body uses yield to produce the value
int letters = switch (day) {
    case MONDAY -> 6;
    default -> {
        int n = day.name().length();
        yield n;
    }
};`

const fallThrough = `public class Fall {
    public static void main(String[] args) {
        int level = 2;
        switch (level) {
            case 1:
                System.out.println("one");
            case 2:
                System.out.println("two");
            case 3:
                System.out.println("three");
            default:
                System.out.println("other");
        }
    }
}`

export default function ControlFlowLesson() {
  return (
    <>
      <p>
        Decisions in Java come in two shapes: <code>if</code>, which tests any boolean condition, and{" "}
        <code>switch</code>, which selects on the value of a single expression. The <code>if</code> half has almost
        no surprises. The <code>switch</code> half has one enormous one — and a modern replacement that removes it.
      </p>

      <h2>if / else if / else</h2>
      <CodeBlock language="java" filename="grading" code={ifElse} />
      <p>
        The condition must be a <code>boolean</code>. Java will not accept an <code>int</code> here, which quietly
        kills the classic C bug where <code>if (x = 5)</code> assigns instead of comparing — in Java that's a
        compile error unless <code>x</code> is itself a boolean.
      </p>

      <Callout variant="tip" title="Always use braces">
        Java allows a single statement without braces, and it has bitten enough projects — including a famous TLS
        bug — that most style guides simply ban it. Braces make adding a second line safe, and cost you nothing.
      </Callout>

      <h2>Guard clauses beat nesting</h2>
      <CodeBlock language="java" filename="two ways to say the same thing" code={guardClause} />
      <p>
        Deeply nested conditionals force a reader to hold every enclosing condition in their head. Returning early
        for each failure case means that by the time you reach the last line, everything that could have gone wrong
        already has — and the happy path sits at the left margin where it's easy to find.
      </p>

      <h2>switch, and the fall-through trap</h2>
      <CodeBlock language="java" filename="classic switch" code={oldSwitch} />
      <p>
        In the classic form, <code>case</code> is a <em>label</em>, not a branch. Execution jumps to the matching
        label and then keeps going straight through every case beneath it until it hits a <code>break</code>. That
        behaviour is occasionally useful — grouping <code>MONDAY</code> through <code>FRIDAY</code> above relies on
        it — and is otherwise the single most common source of switch bugs.
      </p>

      <OutputPredictor
        code={fallThrough}
        options={[
          { id: "a", text: "two" },
          { id: "b", text: "two\nthree\nother" },
          { id: "c", text: "one\ntwo\nthree\nother" },
          { id: "d", text: "two\nother" },
        ]}
        correctId="b"
        explanation={
          <p>
            Control enters at <code>case 2</code> and, with no <code>break</code> anywhere, runs through every
            remaining label including <code>default</code>. Three lines print. This is exactly why the arrow form
            was introduced — it has no fall-through at all, so the bug cannot be written.
          </p>
        }
      />

      <h2>Modern switch: arrows and expressions</h2>
      <CodeBlock language="java" filename="Java 14+" code={newSwitch} />
      <p>
        The arrow form runs only the matching branch — no <code>break</code>, no fall-through. Better still,{" "}
        <code>switch</code> can now be an <strong>expression</strong> that produces a value, which brings two
        benefits: the result can be assigned to a <code>final</code> variable, and when switching over an{" "}
        <code>enum</code> the compiler checks you've covered every constant. Miss one and it's a compile error
        rather than a silent <code>null</code> at 3am.
      </p>

      <AnalogyCard title="A lift with buttons versus a staircase with landings.">
        The classic switch is a staircase: you step on at your floor and keep walking down through every landing
        until something stops you. The arrow switch is a lift: you press 2, the doors open at 2, and floor 3 never
        happens. Both get you to floor 2 — only one of them can accidentally take you to the basement.
      </AnalogyCard>

      <h2>What switch can switch on</h2>
      <ul>
        <li>
          <code>byte</code>, <code>short</code>, <code>char</code>, <code>int</code> and their wrapper types.
        </li>
        <li>
          <code>String</code> — since Java 7, compiled to a hash lookup plus an equality check.
        </li>
        <li>
          <code>enum</code> constants — the best fit, because the compiler can check exhaustiveness.
        </li>
        <li>
          Since Java 21, <strong>any type</strong>, via pattern matching:{" "}
          <code>case Integer i when i &gt; 100 -&gt; ...</code>
        </li>
      </ul>
      <p>
        Not <code>long</code>, <code>float</code>, <code>double</code> or <code>boolean</code> — the first because
        of how the underlying bytecode instructions work, the last because <code>if</code> already covers two
        cases perfectly.
      </p>

      <CommonMistake
        title="forgetting break in a classic switch"
        wrong={`switch (status) {
    case "NEW":
        notifyCustomer();
    case "PAID":
        shipOrder();        // also runs for NEW!
        break;
    default:
        log(status);
}`}
        right={`switch (status) {
    case "NEW" -> notifyCustomer();
    case "PAID" -> shipOrder();
    default -> log(status);
}`}
        explanation={
          <p>
            A missing <code>break</code> ships orders that were never paid for, and the compiler says nothing
            because fall-through is legal. Using the arrow form removes the entire category of bug; if you must
            maintain a classic switch, an explicit <code>// falls through</code> comment on the deliberate cases
            tells readers (and static analysers) that you meant it.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            <code>if</code> asks a yes/no question and runs one of two blocks. <code>switch</code> compares one
            value against a list of options. In the old style of switch you must write <code>break</code> at the end
            of each option or it keeps running into the next one; the newer arrow style doesn't have that problem.
          </p>
        }
        developer={
          <p>
            <code>switch</code> compiles to <code>tableswitch</code> or <code>lookupswitch</code> — a jump table or
            a binary search over case keys — which is why it can outperform a long <code>if</code> chain and why{" "}
            <code>long</code> isn't supported. String switch compiles to a <code>hashCode</code> switch followed by{" "}
            <code>equals</code> checks. Switch expressions must be exhaustive; over a sealed type or enum the
            compiler enforces this, otherwise you need a <code>default</code>.
          </p>
        }
        interview={
          <p>
            Two things to be able to state: fall-through exists because Java inherited C's semantics, and the arrow
            form (Java 14) plus switch expressions eliminate it while adding compiler-checked exhaustiveness. If
            asked what switch can't take, name <code>long</code>, <code>float</code>, <code>double</code>,{" "}
            <code>boolean</code> — and mention that Java 21 pattern matching makes the whole question much less
            interesting, since you can now switch on any reference type with guards.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What is the main advantage of a switch expression over a switch statement, beyond avoiding break?"
        options={[
          { id: "a", text: "It runs faster at runtime" },
          { id: "b", text: "It produces a value, and over an enum or sealed type the compiler checks every case is covered" },
          { id: "c", text: "It can switch on double values" },
          { id: "d", text: "It allows fall-through when you want it" },
        ]}
        correctId="b"
        explanation="Being an expression means the result can be assigned to a final variable, and exhaustiveness checking turns 'someone added an enum constant and forgot this switch' from a runtime surprise into a compile error. Performance is essentially identical."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Let the compiler catch a missing case"
        hint={
          <p>
            Use a switch <em>expression</em> over the enum with no <code>default</code> branch, then add a new
            constant to the enum and recompile.
          </p>
        }
      >
        Write an enum with three constants and a method that maps each one to a description using a switch
        expression. Add a fourth constant and confirm the compiler now refuses to build. Then add a{" "}
        <code>default</code> branch and watch the safety net disappear — that trade-off is worth understanding
        before you reach for <code>default</code> out of habit.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why does switch fall through, and how do you avoid it?"
        answer={
          <p>
            Java inherited the behaviour from C, where <code>case</code> is a jump label rather than a branch:
            control enters at the matching label and continues until a <code>break</code> or the end of the block. It
            enables grouping several labels around one body, but far more often it causes bugs, because the compiler
            can't tell a deliberate fall-through from a forgotten <code>break</code>. Since Java 14 the arrow form (
            <code>case X -&gt; ...</code>) executes only the matching branch, and switch expressions add
            exhaustiveness checking over enums and sealed types. New code should use the arrow form by default.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Conditions must be boolean, so 'if (x = 5)' is a compile error rather than a silent bug.",
          "Guard clauses flatten nesting: handle the failure cases first and let the happy path finish the method.",
          "Classic switch falls through every label until it hits break — deliberate grouping and accidental bugs look identical.",
          "The arrow form (Java 14+) has no fall-through; as an expression it also produces a value.",
          "Switch expressions over enums and sealed types are checked for exhaustiveness at compile time.",
        ]}
      />
    </>
  )
}
