require("./helpers/aliases.cjs");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const { database, wedding: sample } = require("./helpers/runtime.cjs");
const React = require("react");
const { create, act } = require("react-test-renderer");
global.IS_REACT_ACT_ENVIRONMENT = true;
let store,
  wedding,
  params = {},
  width = 390,
  fontScale = 1;
const destinations = [];
const Tabs = (props) => React.createElement("Tabs", props);
Tabs.Screen = (props) => React.createElement("TabScreen", props);
const refresh = async () => {
  wedding = await require("@/features/wedding/model/weddingService").getWedding(store.db);
};
const originalLoad = Module._load;
Module._load = function (name, parent, main) {
  if (name === "react-native")
    return {
      View: "View",
      Text: "Text",
      TextInput: "TextInput",
      Pressable: "Pressable",
      ScrollView: "ScrollView",
      KeyboardAvoidingView: "KeyboardAvoidingView",
      ActivityIndicator: "ActivityIndicator",
      Switch: "Switch",
      Modal: (props) =>
        props.visible ? React.createElement("Modal", props) : null,
      Alert: { alert: () => {} },
      StyleSheet: { create: (x) => x, hairlineWidth: 1 },
      Platform: { OS: "android", select: (x) => x.default },
      useWindowDimensions: () => ({ width, height: 800, fontScale, scale: 1 }),
    };
  if (name === "react-native-safe-area-context")
    return {
      SafeAreaView: "SafeAreaView",
      useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
    };
  if (name === "@expo/vector-icons") return { Ionicons: "Icon" };
  if (name === "expo-router")
    return {
      Tabs,
      Redirect: (props) => React.createElement("Redirect", props),
      router: {
        push: (p) => destinations.push(p),
        replace: (p) => destinations.push(p),
        canGoBack: () => true,
        back: () => destinations.push("back"),
      },
      useFocusEffect: (fn) => React.useEffect(fn, [fn]),
      useLocalSearchParams: () => params,
    };
  if (name === "expo-sqlite") return { useSQLiteContext: () => store.db };
  if (name.endsWith("/features/wedding/model/WeddingProvider"))
    return {
      useWedding: () => ({ wedding, loading: false, error: null, refresh }),
    };
  if (name.endsWith("/core/session/SessionProvider"))
    return {
      useSession: () => ({ mode: "local", user: null, error: null }),
    };
  return originalLoad.call(this, name, parent, main);
};
before(async () => {
  store = await database();
  await refresh();
});
after(() => {
  store.close();
  Module._load = originalLoad;
});
async function render(file) {
  let tree;
  await act(async () => {
    tree = create(React.createElement(require(file).default));
  });
  return tree;
}
async function dispose(tree) {
  await act(async () => tree.unmount());
}
function text(tree) {
  return JSON.stringify(tree.toJSON());
}
function label(node) {
  return node
    .findAllByType("Text")
    .map((n) =>
      n.children
        .filter((c) => typeof c === "string" || typeof c === "number")
        .join(""),
    )
    .join(" ");
}
async function press(tree, title) {
  const button = tree.root
    .findAllByType("Pressable")
    .find((n) => label(n) === title);
  assert.ok(button, `Button ${title}`);
  await act(async () => {
    button.props.onPress();
  });
}
async function input(tree, label, value) {
  const field = tree.root
    .findAllByType("TextInput")
    .find((n) => n.props.accessibilityLabel === label);
  assert.ok(field, `Field ${label}`);
  await act(async () => field.props.onChangeText(value));
}
test("first access and legacy minimal wedding lead to onboarding; configured wedding leads Home", async () => {
  wedding = null;
  let tree = await render("@/features/auth/view/StartupView");
  assert.equal(tree.root.findByType("Redirect").props.href, "/onboarding");
  await dispose(tree);
  wedding = { ...sample, partner_one_name: "", onboarding_completed: 1 };
  tree = await render("@/features/auth/view/StartupView");
  assert.equal(tree.root.findByType("Redirect").props.href, "/onboarding");
  await dispose(tree);
  await refresh();
  tree = await render("@/features/auth/view/StartupView");
  assert.equal(tree.root.findByType("Redirect").props.href, "/(tabs)");
  await dispose(tree);
});
test("five tabs retain full labels at 320,360,390,430dp and increased font scale", async () => {
  for (const size of [320, 360, 390, 430])
    for (const scale of [1, 1.5, 2]) {
      width = size;
      fontScale = scale;
      const tree = await render("@/core/navigation/TabLayout");
      const tabs = tree.root.findAllByType("TabScreen");
      assert.deepEqual(
        tabs.map((n) => n.props.options.title),
        ["Início", "Planejar", "Convidados", "Finanças", "Mais"],
      );
      for (const tab of tabs) {
        const element = tab.props.options.tabBarLabel({ color: "green" });
        assert.equal(element.props.children, tab.props.options.title);
        assert.equal(element.props.numberOfLines, undefined);
      }
      await dispose(tree);
    }
  fontScale = 1;
  width = 390;
});
test("real Home and all primary screens render SQLite data without visible placeholders", async () => {
  for (const [file, label] of [
    ["index", "Hoje"],
    ["planejar", "Planejamento"],
    ["convidados", "Convidados"],
    ["financas", "Finanças"],
    ["mais", "Mais"],
  ]) {
    const tree = await render(`../app/(tabs)/${file}.tsx`);
    assert.ok(text(tree).includes(label));
    assert.doesNotMatch(
      text(tree),
      /PRÉVIA|DADOS DEMONSTRATIVOS|próxima etapa|Modo Decisão/,
    );
    if (file === "index") {
      assert.match(text(tree), /Alex/);
      assert.match(text(tree), /Dani/);
    }
    await dispose(tree);
  }
});
test("every create form saves to SQLite, rejects blank required fields and ignores a double save", async () => {
  const cases = [
    ["tasks", "tasks", { Título: "Tarefa da interface" }],
    ["guests", "guests", { Nome: "Convidado da interface" }],
    [
      "groups",
      "guest_groups",
      { "Nome do grupo / família": "Grupo da interface" },
    ],
    [
      "events",
      "wedding_events",
      { Nome: "Cerimônia da interface", Data: "22/05/2027", Horário: "15:00" },
    ],
    [
      "appointments",
      "appointments",
      { Título: "Reunião da interface", Data: "20/05/2027", Horário: "14:30" },
    ],
    [
      "vendors",
      "vendors",
      {
        Nome: "Fornecedor da interface",
        "Valor do fornecedor (R$)": "7.500,00",
      },
    ],
    [
      "payments",
      "payments",
      {
        Título: "Parcela da interface",
        "Valor (R$)": "2.500,00",
        Vencimento: "20/05/2027",
      },
    ],
    [
      "budget",
      "budget_categories",
      {
        Categoria: "Categoria da interface",
        "Valor planejado (R$)": "8.000,00",
      },
    ],
  ];
  for (const [route, table, fields] of cases) {
    params = {};
    const before = store.native
      .prepare(`SELECT COUNT(*) n FROM ${table}`)
      .get().n;
    const tree = await render(`../app/${route}/new.tsx`);
    await press(tree, "Salvar");
    assert.equal(
      store.native.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,
      before,
    );
    assert.ok(
      tree.root
        .findAllByType("Text")
        .some((n) => n.props.accessibilityRole === "alert"),
    );
    for (const [key, value] of Object.entries(fields))
      await input(tree, key, value);
    const button = tree.root
      .findAllByType("Pressable")
      .find((n) => label(n) === "Salvar");
    await act(async () => {
      button.props.onPress();
      button.props.onPress();
    });
    assert.equal(
      store.native.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,
      before + 1,
      route,
    );
    await dispose(tree);
    const record = store.native
      .prepare(
        `SELECT id FROM ${table} ORDER BY created_at DESC,id DESC LIMIT 1`,
      )
      .get();
    params = { id: record.id };
    const edit = await render(`../app/${route}/[id].tsx`);
    try {
      assert.ok(
        edit.root.findAllByType("TextInput").length > 0,
        route + ": " + text(edit),
      );
    } finally {
      await dispose(edit);
    }
  }
});
test("onboarding four forms update the existing wedding without generating duplicates", async () => {
  params = {};
  let tree = await render("../app/onboarding/casal.tsx");
  await input(tree, "Seu nome", "Alex");
  await input(tree, "Nome do seu par", "Dani");
  await press(tree, "Continuar");
  await dispose(tree);
  tree = await render("../app/onboarding/casamento.tsx");
  await input(tree, "Data do casamento", "22/05/2027");
  await input(tree, "Cidade", "São Paulo");
  await press(tree, "Continuar");
  await dispose(tree);
  tree = await render("../app/onboarding/planejamento.tsx");
  await input(tree, "Estimativa de pessoas", "120");
  await input(tree, "Orçamento total aproximado (R$)", "60.000,00");
  await press(tree, "Continuar");
  await dispose(tree);
  const count = store.native.prepare("SELECT COUNT(*) n FROM tasks").get().n;
  tree = await render("../app/onboarding/finalizar.tsx");
  await press(tree, "Começar a planejar");
  await dispose(tree);
  assert.equal(
    store.native.prepare("SELECT COUNT(*) n FROM weddings").get().n,
    1,
  );
  assert.equal(
    store.native.prepare("SELECT COUNT(*) n FROM tasks").get().n,
    count,
  );
});
test("lists and forms render across requested widths; editable wedding and collections have actions", async () => {
  for (const size of [320, 360, 390, 430]) {
    width = size;
    params = {};
    for (const file of [
      "../app/appointments/index.tsx",
      "../app/events/index.tsx",
      "../app/vendors/index.tsx",
      "../app/payments/index.tsx",
      "../app/groups/index.tsx",
      "../app/wedding.tsx",
    ]) {
      const tree = await render(file);
      assert.ok(tree.root.findAllByType("Pressable").length > 0);
      await dispose(tree);
    }
  }
});
test("Home and planning destinations exist, and decision routes have no main entry point", async () => {
  destinations.length = 0;
  params = {};
  for (const file of ["index", "planejar"]) {
    const tree = await render(`../app/(tabs)/${file}.tsx`);
    for (const button of tree.root
      .findAllByType("Pressable")
      .filter((n) => n.props.accessibilityRole === "button"))
      await act(async () => button.props.onPress());
    await dispose(tree);
  }
  for (const target of destinations) {
    if (target === "back") continue;
    const route = typeof target === "string" ? target : target.pathname;
    assert.ok(
      fs.existsSync(`app${route}.tsx`) ||
        fs.existsSync(`app${route}/index.tsx`) ||
        fs.existsSync(`app/(tabs)${route}.tsx`) ||
        fs.existsSync(`app${route.slice(0, route.lastIndexOf("/"))}/[id].tsx`),
      route,
    );
    assert.ok(!route.includes("decisions"));
  }
});
