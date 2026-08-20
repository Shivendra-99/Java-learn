import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const firstTest = `import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BankAccountTest {

    @Test
    void depositIncreasesBalance() {
        // Arrange
        var account = new BankAccount("Ana", 1000);

        // Act
        account.deposit(500);

        // Assert
        assertEquals(1500, account.balance());
    }

    @Test
    void withdrawingMoreThanTheBalanceIsRejected() {
        var account = new BankAccount("Ana", 100);

        assertThrows(InsufficientFundsException.class, () -> account.withdraw(500));
        assertEquals(100, account.balance(), "balance must be unchanged after a failed withdrawal");
    }
}`

const assertions = `assertEquals(expected, actual);            // note the order — expected FIRST
assertEquals(expected, actual, "message"); // the message shows on failure
assertNotEquals(a, b);
assertTrue(condition);
assertFalse(condition);
assertNull(value);  assertNotNull(value);
assertSame(a, b);                          // reference identity, not equals

assertThrows(IllegalArgumentException.class, () -> service.process(null));
assertDoesNotThrow(() -> service.process(valid));

assertArrayEquals(expected, actual);
assertIterableEquals(expected, actual);

// Report every failure, not just the first
assertAll("order",
    () -> assertEquals("A-1", order.reference()),
    () -> assertEquals(Status.PAID, order.status()),
    () -> assertEquals(4200, order.total()));

assertTimeout(Duration.ofMillis(100), () -> service.fastOperation());

// For floating point, always give a tolerance:
assertEquals(0.3, a + b, 0.0001);`

const lifecycle = `class OrderServiceTest {

    @BeforeAll                 // once, before everything — must be static
    static void startDatabase() { ... }

    @BeforeEach                // before EVERY test — fresh state each time
    void setUp() {
        repository = new InMemoryOrderRepository();
        service = new OrderService(repository);
    }

    @Test
    void ...

    @AfterEach                 // after every test
    void tearDown() { ... }

    @AfterAll                  // once, at the end — must be static
    static void stopDatabase() { ... }
}

// JUnit 5 creates a NEW instance of the test class for every test
// method, so fields cannot leak between tests. That is deliberate.`

const parameterised = `@ParameterizedTest
@ValueSource(strings = {"", "  ", "\\t", "\\n"})
void blankInputIsRejected(String input) {
    assertThrows(IllegalArgumentException.class, () -> new User(input));
}

@ParameterizedTest
@CsvSource({
    "1, 1, 2",
    "2, 3, 5",
    "-1, 1, 0"
})
void addsCorrectly(int a, int b, int expected) {
    assertEquals(expected, Calculator.add(a, b));
}

@ParameterizedTest
@EnumSource(Status.class)
void everyStatusHasALabel(Status status) {
    assertNotNull(status.label());
}

@ParameterizedTest
@MethodSource("invalidOrders")
void invalidOrdersAreRejected(Order order) { ... }

static Stream<Order> invalidOrders() {
    return Stream.of(orderWithNoItems(), orderWithNegativeTotal());
}`

const naming = `// Poor: tells you nothing when it fails at 3am
@Test void test1() { }
@Test void testWithdraw() { }

// Good: the failure message alone explains the bug
@Test void withdrawingMoreThanTheBalanceThrows() { }
@Test void depositOfZeroIsRejected() { }

// Also good, with @DisplayName for full sentences
@Test
@DisplayName("a cancelled order cannot be shipped")
void cancelledOrderCannotBeShipped() { }

// Or nested, for grouping by scenario
@Nested
class WhenTheAccountIsOverdrawn {
    @Test void depositsAreStillAccepted() { }
    @Test void withdrawalsAreRejected() { }
}`

const mocking = `// Mockito: replace a collaborator you do not want to really call
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock PaymentGateway gateway;
    @InjectMocks OrderService service;

    @Test
    void aDeclinedPaymentLeavesTheOrderUnpaid() {
        when(gateway.charge(anyLong())).thenReturn(PaymentResult.DECLINED);

        service.checkout(order);

        assertEquals(Status.NEW, order.status());
        verify(gateway).charge(4200L);          // it WAS called, with this argument
        verify(mailer, never()).sendReceipt(any());
    }
}

// Mock what is slow, external, or non-deterministic: HTTP, databases,
// clocks, message brokers. Do NOT mock the class you are testing, and
// do not mock value objects — just construct them.`

export default function TestingWithJunitLesson() {
  return (
    <>
      <p>
        Tests exist so you can change code without fear. A test that only passes tells you nothing; the value is in
        a test that <em>fails for the right reason</em> when you break something. JUnit 5 is the standard, and
        ninety per cent of what you need is four annotations and half a dozen assertions.
      </p>

      <h2>A first test</h2>
      <CodeBlock language="java" filename="BankAccountTest.java" code={firstTest} />
      <p>
        Note the shape: <strong>arrange</strong> the state, <strong>act</strong> once, <strong>assert</strong> the
        outcome. One behaviour per test. When a test with three unrelated assertions fails, you have to read it to
        find out what broke; when a well-named test with one assertion fails, the name tells you.
      </p>

      <h2>Assertions</h2>
      <CodeBlock language="java" filename="org.junit.jupiter.api.Assertions" code={assertions} />
      <Callout variant="warning" title="assertEquals takes expected first">
        Swap the arguments and the test still passes — but every failure message is backwards: "expected 1500 but
        was 2000" when the truth is the opposite. It's a small thing that costs real time during a debugging
        session.
      </Callout>

      <h2>Lifecycle</h2>
      <CodeBlock language="java" filename="setup and teardown" code={lifecycle} />
      <p>
        JUnit 5 constructs a fresh instance of the test class for each test method, so state can't leak between
        them. That's why tests can run in any order — and why a test that only passes when run after another one is
        a bug in the test, not in JUnit.
      </p>

      <AnalogyCard title="A smoke alarm you test on purpose.">
        An alarm that has never gone off tells you nothing — it might be perfect or the battery might be dead. The
        only way to trust it is to set it off deliberately. That's what writing a failing test first does: it proves
        the test can detect the problem, so a green run afterwards actually means something.
      </AnalogyCard>

      <h2>Parameterised tests</h2>
      <CodeBlock language="java" filename="the same test, many inputs" code={parameterised} />

      <h2>Naming</h2>
      <CodeBlock language="java" filename="the name is the documentation" code={naming} />

      <h2>Mocking collaborators</h2>
      <CodeBlock language="java" filename="Mockito" code={mocking} />

      <CommonMistake
        title="a test that asserts nothing"
        wrong={`@Test
void processOrder() {
    service.process(order);      // if it doesn't throw, the test passes
}

@Test
void checkTotal() {
    var total = calculator.total(items);
    System.out.println(total);   // printing is not asserting
}`}
        right={`@Test
void processingAPaidOrderMarksItShipped() {
    service.process(order);

    assertEquals(Status.SHIPPED, order.status());
}

@Test
void totalIncludesTaxOnEveryItem() {
    assertEquals(4620, calculator.total(items));
}`}
        explanation={
          <p>
            A test with no assertion only fails if the code throws, which makes it a smoke test wearing a test's
            name — and it contributes to a coverage number that now overstates your safety. If you can't think of
            what to assert, you probably haven't decided what the method is supposed to guarantee, which is worth
            discovering before the code ships rather than after.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A test is a small method that sets something up, calls your code, and checks the result is what you
            expected. Mark it <code>@Test</code> and your IDE or build tool runs it. If it fails, you find out
            immediately rather than in production.
          </p>
        }
        developer={
          <p>
            JUnit 5 (Jupiter) instantiates the test class per method, so tests are isolated and order-independent
            by default. <code>@BeforeEach</code>/<code>@AfterEach</code> run per test;{" "}
            <code>@BeforeAll</code>/<code>@AfterAll</code> are static and run once.{" "}
            <code>@ParameterizedTest</code> with <code>@ValueSource</code>, <code>@CsvSource</code>,{" "}
            <code>@EnumSource</code> or <code>@MethodSource</code> collapses repetitive cases.{" "}
            <code>assertThrows</code> returns the exception so you can assert on its message.{" "}
            <code>assertAll</code> reports every failure rather than stopping at the first.
          </p>
        }
        interview={
          <p>
            Common ground: the arrange-act-assert structure; the lifecycle annotations and their order; why tests
            must be independent; and what to mock (slow, external, or non-deterministic collaborators — not the
            class under test, not value objects). A good opinion to hold: coverage percentage measures which lines
            ran, not whether anything was verified, so it's a smell detector rather than a goal.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why does JUnit 5 create a new instance of the test class for every test method?"
        options={[
          { id: "a", text: "To make tests run faster in parallel" },
          { id: "b", text: "So that instance fields cannot leak state between tests, keeping them independent and order-agnostic" },
          { id: "c", text: "Because test classes cannot have constructors" },
          { id: "d", text: "To allow @BeforeAll to be non-static" },
        ]}
        correctId="b"
        explanation="Fresh instances mean a field mutated by one test can't affect another, so tests can run in any order or in isolation. It's also why @BeforeAll must be static — there is no single instance for it to belong to (unless you opt into @TestInstance(PER_CLASS))."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Write the failing test first"
        hint={
          <p>
            Start with <code>assertThrows</code> for the invalid cases and a <code>@ParameterizedTest</code> with{" "}
            <code>@CsvSource</code> for the valid ones.
          </p>
        }
      >
        Pick a small class you've written and add a test for a behaviour it doesn't have yet. Watch it fail, and
        read the failure message — if it doesn't tell you what's wrong, improve the test before writing the code.
        Then implement until it passes. Finally, break the implementation deliberately and confirm the test catches
        it.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What makes a good unit test?"
        answer={
          <p>
            It tests one behaviour, and its name says which — so a failure identifies the bug without anyone opening
            the file. It's <strong>independent</strong>: no shared mutable state, no reliance on running after
            another test, which is why JUnit 5 builds a fresh instance per method. It's{" "}
            <strong>deterministic</strong>: no real clock, no network, no random values, no ordering assumptions
            over a <code>HashMap</code> — those are exactly what you replace with mocks or fakes. It{" "}
            <strong>actually asserts</strong> something specific, rather than merely confirming nothing threw. And
            it's <strong>fast</strong>, because a suite people wait for is a suite people stop running. The
            structure that gets you most of this is arrange-act-assert with a single act. On coverage: it's useful
            for finding untested areas but a poor target, since a test that executes a line without verifying its
            result still counts towards it.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Arrange, act, assert — one behaviour per test, and name it after that behaviour.",
          "assertEquals takes expected first; assertThrows returns the exception for further assertions.",
          "@BeforeEach runs per test, @BeforeAll once and static; JUnit 5 builds a fresh instance per test method.",
          "@ParameterizedTest with @CsvSource or @MethodSource collapses repetitive cases.",
          "Mock what is slow, external or non-deterministic — never the class under test.",
        ]}
      />
    </>
  )
}
