import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const problem = `// The problem: two processes with the same SHAPE but different steps
class CsvImporter {
    void importAll(Path file) {
        var raw = readFile(file);        // same
        var rows = parseCsv(raw);        // DIFFERENT
        var valid = validate(rows);      // same
        save(valid);                     // same
    }
}
class JsonImporter {
    void importAll(Path file) {
        var raw = readFile(file);        // same
        var rows = parseJson(raw);       // DIFFERENT
        var valid = validate(rows);      // same
        save(valid);                     // same
    }
}
// The order of steps is identical and duplicated. Only one step differs.

// Template Method (behavioural): put the fixed skeleton in a base class,
// and let subclasses supply just the varying steps.`

const template = `abstract class DataImporter {

    // The template method: fixed algorithm, marked final so no subclass
    // can reorder or replace the skeleton
    public final void importAll(Path file) {
        String raw = readFile(file);
        List<Row> rows = parse(raw);          // the varying step
        List<Row> valid = validate(rows);
        save(valid);
    }

    // Steps subclasses MUST supply
    protected abstract List<Row> parse(String raw);

    // Shared steps, implemented once
    private String readFile(Path file) { /* ... */ return ""; }
    private void save(List<Row> rows)  { /* ... */ }

    // A HOOK: a step with a sensible default that subclasses MAY override
    protected List<Row> validate(List<Row> rows) {
        return rows;              // default: accept everything
    }
}

class CsvImporter extends DataImporter {
    protected List<Row> parse(String raw) { return parseCsv(raw); }
}
class JsonImporter extends DataImporter {
    protected List<Row> parse(String raw) { return parseJson(raw); }
    protected List<Row> validate(List<Row> rows) {   // overrides the hook
        return rows.stream().filter(Row::isComplete).toList();
    }
}`

const jdk = `// Template Method throughout the JDK and frameworks

// AbstractList implements iterator(), indexOf(), etc. in terms of the
// abstract get(int) and size() you supply:
class MyList extends AbstractList<String> {
    public String get(int i) { ... }     // you provide the primitives
    public int size() { ... }            // AbstractList provides the rest
}

// HttpServlet.service() dispatches to doGet, doPost, ... which you override.
// InputStream.read(byte[]) is defined in terms of the abstract read().
// Spring's JdbcTemplate runs the boilerplate and calls your RowMapper.`

const finalMatters = `// Why the template method is final:
public final void importAll(Path file) { ... }
//     ^ a subclass cannot change the ORDER or skip a step

// Without final, a subclass could override importAll() entirely and
// break the invariant the pattern exists to protect — that validate()
// always runs before save(). final makes the skeleton a guarantee.`

export default function TemplateMethodPatternLesson() {
  return (
    <>
      <p>
        Template Method fixes the <em>skeleton</em> of an algorithm in a base class and lets subclasses fill in the
        varying steps — without letting them change the order. It's the inverse of Strategy: Strategy composes
        behaviour from outside, Template Method inherits a fixed structure and plugs into holes in it.
      </p>

      <CodeBlock language="text" filename="the duplication problem" code={problem} />

      <h2>A template method</h2>
      <CodeBlock language="java" filename="DataImporter.java" code={template} />
      <p>
        Three kinds of step. <strong>Concrete</strong> steps (<code>readFile</code>, <code>save</code>) are shared
        and written once. <strong>Abstract</strong> steps (<code>parse</code>) every subclass must supply. And{" "}
        <strong>hooks</strong> (<code>validate</code>) have a default the subclass may override or ignore. The
        template method itself calls them in a fixed order.
      </p>

      <Callout variant="warning" title="Make the template method final">
        The whole point is that the <em>order</em> of steps is guaranteed — that <code>validate</code> always runs
        before <code>save</code>. If a subclass could override the template method itself, that guarantee
        evaporates. Marking it <code>final</code> lets subclasses change the steps but never the skeleton.
      </Callout>
      <CodeBlock language="java" filename="why final" code={finalMatters} />

      <AnalogyCard title="A recipe with 'your choice of protein'.">
        The recipe fixes the method, the timings and the order — brown the aromatics, add the protein, simmer,
        finish. Exactly one line says "your choice of protein". Every cook follows the same steps in the same
        order; only the one blank is theirs to fill. Template Method is that recipe: the structure is locked, the
        gaps are yours.
      </AnalogyCard>

      <h2>Template Method in the JDK</h2>
      <CodeBlock language="java" filename="you extend these" code={jdk} />

      <CommonMistake
        title="a template method that isn't final, so a subclass reorders it"
        wrong={`abstract class Report {
    public void generate() {           // NOT final
        var data = fetch();
        var checked = authorize(data);  // security check
        render(checked);
    }
    protected abstract Data fetch();
    protected Data authorize(Data d) { /* check permissions */ return d; }
    protected abstract void render(Data d);
}

class QuickReport extends Report {
    @Override public void generate() {  // overrides the whole thing...
        render(fetch());                // ...and skips authorize entirely
    }
}`}
        right={`abstract class Report {
    public final void generate() {     // final: the skeleton is a guarantee
        var data = fetch();
        var checked = authorize(data);
        render(checked);
    }
    protected abstract Data fetch();
    protected abstract void render(Data d);
}
// Subclasses fill in fetch() and render(), but authorize() always runs.`}
        explanation={
          <p>
            A non-final template method invites a subclass to override the whole algorithm and quietly drop a step —
            here, the authorization check. The pattern's value is the guaranteed order and the always-run steps, and{" "}
            <code>final</code> is what enforces it. Leave it off and you've just written a normal overridable method
            with extra ceremony.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Template Method puts the fixed steps of a process in a parent class, in a fixed order, and leaves gaps
            for subclasses to fill. Every subclass does the same overall thing in the same sequence, but customises
            the one or two steps that differ. The parent method is marked <code>final</code> so nobody can change
            the order.
          </p>
        }
        developer={
          <p>
            A <code>final</code> method in the base class defines the invariant algorithm and calls a mix of
            concrete steps (shared), abstract steps (subclass-supplied) and hooks (overridable defaults). It's
            inheritance-based, so it uses the Hollywood principle — "don't call us, we'll call you". Compared with
            Strategy, which composes behaviour at runtime, Template Method fixes structure at compile time via
            subclassing. <code>AbstractList</code>, <code>InputStream</code>, <code>HttpServlet</code> and Spring's{" "}
            <code>*Template</code> classes are built on it.
          </p>
        }
        interview={
          <p>
            The comparison is Template Method versus Strategy: both let a step vary, but Template Method uses
            inheritance and fixes the skeleton in a base class, while Strategy uses composition and injects the
            varying algorithm as an object. Stress the <code>final</code> template method — it's what guarantees the
            step order and the always-run steps. Name the JDK's <code>Abstract*</code> classes and Spring's{" "}
            <code>JdbcTemplate</code> as examples, and mention hooks as the optional-override mechanism.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is the template method itself usually declared final?"
        options={[
          { id: "a", text: "So it runs faster" },
          { id: "b", text: "So a subclass can change the individual steps but never the order or structure of the algorithm" },
          { id: "c", text: "Because abstract classes require it" },
          { id: "d", text: "So subclasses cannot add new steps" },
        ]}
        correctId="b"
        explanation="The pattern's guarantee is the fixed sequence — e.g. that validation always runs before saving. Marking the template method final lets subclasses fill in the varying steps while making it impossible to reorder them or drop one by overriding the whole method."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Extract a template from duplication"
        hint={
          <p>
            Find the steps that are identical across both classes and pull them into a <code>final</code> method in
            a shared parent; make the differing step abstract.
          </p>
        }
      >
        Take two classes that do the same sequence of steps with one or two differences, and refactor them into a
        base class with a <code>final</code> template method plus abstract steps. Add a hook with a default for a
        step only one subclass needs to customise. Then add a third subclass and confirm you only had to write its
        one differing step.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the Template Method pattern, and how does it differ from Strategy?"
        answer={
          <p>
            Template Method defines the skeleton of an algorithm in a base-class method that runs the steps in a
            fixed order, while deferring some of those steps to subclasses. The steps come in three kinds: concrete
            (shared, implemented in the base class), abstract (each subclass must supply), and hooks (a default the
            subclass may override). The template method itself is declared <code>final</code>, which is essential —
            it guarantees the order and the always-run steps, so a subclass can change <em>what</em> a step does but
            never <em>whether or when</em> it runs. It follows the Hollywood principle: the framework calls your
            code, not the reverse. Compared with <strong>Strategy</strong>, both let a step vary, but the mechanism
            and binding differ. Template Method uses <em>inheritance</em> and fixes the structure at compile time —
            you get one algorithm with pluggable holes. Strategy uses <em>composition</em>, injecting the entire
            varying algorithm as an object chosen at runtime, and favours "composition over inheritance". So
            Template Method suits a fixed process with a few variable steps and a guaranteed order (imports, report
            generation, request handling), while Strategy suits swapping a whole algorithm freely. The JDK uses
            Template Method extensively — <code>AbstractList</code>, <code>InputStream.read</code>,{" "}
            <code>HttpServlet.service</code> — as does Spring's family of <code>*Template</code> classes.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Template Method fixes an algorithm's skeleton in a base class and defers varying steps to subclasses.",
          "Steps are concrete (shared), abstract (must supply) or hooks (overridable defaults).",
          "The template method is final, which guarantees the order and the always-run steps.",
          "It uses inheritance and the Hollywood principle — the framework calls your code.",
          "Strategy is the composition-based alternative; AbstractList and Spring's *Template classes use Template Method.",
        ]}
      />
    </>
  )
}
