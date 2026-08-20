import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TypeHierarchyDiagram } from "@/components/diagram/type-hierarchy-diagram"

const basic = `public abstract class Employee {

    private final String name;          // shared state
    private final long baseSalary;

    protected Employee(String name, long baseSalary) {   // protected: only subclasses call it
        this.name = name;
        this.baseSalary = baseSalary;
    }

    // Shared behaviour, written once
    public String name() { return name; }
    public long baseSalary() { return baseSalary; }

    // No body: every subclass MUST supply this
    public abstract long monthlyPay();

    // Concrete method built on top of the abstract one
    public String payslip() {
        return name + ": " + monthlyPay() + "p";
    }
}

public class SalariedEmployee extends Employee {
    public SalariedEmployee(String name, long annual) { super(name, annual); }

    @Override
    public long monthlyPay() { return baseSalary() / 12; }
}

public class HourlyEmployee extends Employee {
    private final int hoursWorked;

    public HourlyEmployee(String name, long hourlyRate, int hoursWorked) {
        super(name, hourlyRate);
        this.hoursWorked = hoursWorked;
    }

    @Override
    public long monthlyPay() { return baseSalary() * hoursWorked; }
}

new Employee("Ana", 1000);      // compile error: Employee is abstract`

const template = `// The template method pattern: the parent fixes the ALGORITHM,
// subclasses fill in the steps.
public abstract class ReportGenerator {

    // final: subclasses change the steps, never the order
    public final Report generate(Query query) {
        var rows = fetch(query);
        var filtered = filter(rows);
        return render(filtered);
    }

    protected abstract List<Row> fetch(Query query);
    protected abstract Report render(List<Row> rows);

    // A hook with a sensible default — override only if you need to
    protected List<Row> filter(List<Row> rows) {
        return rows;
    }
}`

const abstractRules = `public abstract class Example {

    int field = 5;                       // state: allowed (interfaces cannot)
    private String secret;               // private members: allowed

    Example() { }                        // constructors: allowed, called via super()

    abstract void mustImplement();       // no body, subclasses must supply one

    void alreadyDone() { }               // concrete methods: allowed

    static void helper() { }             // static methods: allowed

    // abstract void impossible() { }    // error: abstract methods have no body
    // private abstract void x();        // error: private can never be overridden
    // final abstract void y();          // error: final can never be overridden
}`

export default function AbstractClassesLesson() {
  return (
    <>
      <p>
        An abstract class is one you can't instantiate, because it's incomplete on purpose. It exists to hold what a
        family of classes has in common — state, constructors, finished methods — while leaving the parts that
        genuinely differ for subclasses to fill in.
      </p>

      <h2>A worked example</h2>
      <CodeBlock language="java" filename="Employee.java" code={basic} />
      <p>
        Note what the abstract class is doing: it stores the shared fields, enforces them through a constructor,
        implements <code>payslip()</code> once for everyone — and refuses to guess at <code>monthlyPay()</code>,
        because there is no sensible default. That combination is the whole idea.
      </p>

      <TypeHierarchyDiagram
        title="Abstract at the top, concrete at the leaves"
        initialSelected="employee"
        nodes={[
          {
            id: "employee",
            name: "Employee",
            kind: "abstract",
            tag: "cannot be instantiated",
            detail:
              "Holds name and baseSalary, provides payslip(), and declares monthlyPay() abstract. You can declare a variable of this type — you just can't create one with new.",
          },
          {
            id: "salaried",
            name: "SalariedEmployee",
            kind: "class",
            parent: "employee",
            tag: "annual / 12",
            detail: "Concrete: it implements every abstract method, so it can be instantiated. It inherits payslip() unchanged.",
          },
          {
            id: "hourly",
            name: "HourlyEmployee",
            kind: "class",
            parent: "employee",
            tag: "rate x hours",
            detail: "Also concrete, with its own extra field. Both subclasses satisfy the same contract in different ways — payslip() works for both without knowing which it has.",
          },
          {
            id: "contractor",
            name: "Contractor",
            kind: "abstract",
            parent: "employee",
            tag: "still abstract",
            detail: "An abstract class may extend another and leave some methods unimplemented. Only the leaves that implement everything can be instantiated.",
          },
        ]}
      />

      <h2>What abstract classes can contain</h2>
      <CodeBlock language="java" filename="the rules" code={abstractRules} />
      <p>
        The important ones: an abstract class <strong>can</strong> have constructors, fields, private members and
        fully implemented methods; it <strong>cannot</strong> be instantiated; and any class that extends it without
        implementing every abstract method must itself be declared abstract.
      </p>

      <AnalogyCard title="A recipe with one ingredient left as 'your choice of protein'.">
        Everything else is specified: the timings, the method, the sauce. You can't cook "the recipe" as written —
        it isn't a dish until someone picks the protein. But every version made from it shares the same technique,
        and if the sauce needs fixing, it gets fixed once, for all of them.
      </AnalogyCard>

      <h2>The template method pattern</h2>
      <CodeBlock language="java" filename="fixing the algorithm, varying the steps" code={template} />
      <p>
        This is the abstract class earning its keep. The parent owns the sequence and marks it <code>final</code> so
        no subclass can reorder it; subclasses supply the steps. You'll find this exact shape throughout the JDK and
        Spring — <code>AbstractList</code>, <code>InputStream</code>, <code>HttpServlet</code>.
      </p>

      <Callout variant="info" title="Abstract class or interface?">
        Use an <strong>abstract class</strong> when the subtypes share state or constructor logic, or when you want
        to control an algorithm and let parts vary. Use an <strong>interface</strong> when you're describing a
        capability that unrelated types might have, or when implementers may already extend something else. Since
        Java 8 interfaces can carry default methods, so the gap has narrowed — but only abstract classes can hold
        instance fields.
      </Callout>

      <CommonMistake
        title="an abstract class with no abstract methods and no shared state"
        wrong={`public abstract class BaseService {
    protected Logger log = LoggerFactory.getLogger(getClass());

    protected void logStart() { log.info("starting"); }
    protected void logEnd()   { log.info("done"); }
}

// Every service now extends this and has burnt its single
// inheritance slot on two log lines.`}
        right={`// A collaborator, injected where it is needed
public class ServiceLogger {
    private final Logger log;
    public ServiceLogger(Class<?> owner) { ... }
    public void start() { log.info("starting"); }
}

// Or an interface with default methods, which doesn't
// consume the subclass's one superclass slot.
public interface Timed {
    default void logStart() { ... }
}`}
        explanation={
          <p>
            Java gives each class exactly one superclass. Spending it on shared utility code means the class can
            never extend anything more meaningful later. Ask whether the subclasses genuinely form a family with
            shared state and a shared contract; if the answer is "they just needed the same helper", you want
            composition or an interface.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            An abstract class is a half-written class. It holds the parts every version shares and leaves gaps that
            each specific version must fill. You can't create one directly — you create one of its completed
            subclasses.
          </p>
        }
        developer={
          <p>
            Abstract classes may declare constructors (invoked via <code>super()</code> during subclass
            construction), instance and static fields, and any mix of abstract and concrete methods. A subclass must
            implement every inherited abstract method or be abstract itself. The template method pattern — a{" "}
            <code>final</code> public method calling protected abstract steps — is the canonical use, and it's how
            much of the JDK's <code>Abstract*</code> scaffolding works.
          </p>
        }
        interview={
          <p>
            The standard question is abstract class versus interface. Key points: single inheritance versus many
            interfaces; abstract classes can hold instance state and constructors, interfaces cannot; interface
            members are implicitly public while abstract classes support all access levels. Then the judgement:
            abstract class for "is a kind of, with shared implementation", interface for "is capable of". Mentioning
            that Java 8 defaults narrowed but did not close the gap shows current knowledge.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which of these is legal?"
        options={[
          { id: "a", text: "Creating an instance with new AbstractThing()" },
          { id: "b", text: "An abstract class with a constructor and no abstract methods" },
          { id: "c", text: "A private abstract method" },
          { id: "d", text: "An abstract method with an empty body { }" },
        ]}
        correctId="b"
        explanation="An abstract class needs no abstract methods at all — declaring it abstract is enough to prevent instantiation, and constructors are allowed and normal (subclasses call them via super). Private and final abstract methods are contradictions, since neither can ever be overridden, and an abstract method by definition has no body."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Write a template method"
        hint={
          <p>
            Make the public entry point <code>final</code> so subclasses can't reorder the steps, and give one step
            a default implementation so subclasses only override it when they need to.
          </p>
        }
      >
        Design an abstract <code>DataImporter</code> whose public <code>importAll()</code> method reads, validates,
        and saves — in that order — with reading and saving abstract and validation defaulting to "accept
        everything". Write two subclasses (CSV and JSON, say) and confirm that the sequence is identical for both
        while the steps differ.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="When would you choose an abstract class over an interface?"
        answer={
          <p>
            When the subtypes share <em>state</em> or construction logic, since only an abstract class can declare
            instance fields and constructors. And when you want to own an algorithm while letting parts of it vary —
            the template method pattern, where a <code>final</code> method calls abstract steps. Interfaces are the
            better choice when you're describing a capability that unrelated classes might have (
            <code>Comparable</code>, <code>Closeable</code>), because a class can implement many interfaces but
            extend only one class — so an abstract class spends the implementer's single inheritance slot. Since
            Java 8, interfaces can supply default implementations, so the deciding factor is usually state:
            if you need fields, it's an abstract class.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "An abstract class can't be instantiated; it exists to be extended.",
          "It may hold fields, constructors, private members and concrete methods — an interface can't hold instance fields.",
          "A subclass must implement every abstract method, or be declared abstract itself.",
          "The template method pattern — a final method calling abstract steps — is the classic use.",
          "It spends the subclass's one inheritance slot, so don't use one merely to share a helper.",
        ]}
      />
    </>
  )
}
