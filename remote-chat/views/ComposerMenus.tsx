import { displayError, displayText, t, useLanguage } from '../../localization/browserClient';
import { useEffect, useState, type ButtonHTMLAttributes, type RefObject } from 'react';
import { Box, Camera, File, Folder, Image, X } from 'lucide-react';
import type { Skill } from './types';
import type { ComposerPlugin } from '../../conversation/attachmentTypes';
import type { RemoteComposerCatalog } from '../composerCatalog';
import { skillDescription, skillLabel, type SkillCatalogState } from '../../chat/skillCatalog';
import { FocusPreservingButton } from '../../chat/FocusPreservingButton';
import { useComposerMenuKeyboard, type ComposerMenuOption } from './useComposerMenuKeyboard';
import { useChatSurfaceTheme } from './useChatSurfaceTheme';

export type ComposerAddAction = 'camera' | 'photos' | 'file' | 'projectFiles' | 'projectPhotos' | 'plugins';
const ADD_ACTIONS = [
  { id: 'camera', get label() { return t("client.chat.takePhoto"); }, icon: Camera }, { id: 'photos', get label() { return t("client.chat.photos"); }, icon: Image },
  { id: 'file', get label() { return t("client.chat.files.39932f"); }, icon: File }, { id: 'projectFiles', get label() { return t("client.projectBrowser.projectFiles"); }, icon: Folder },
  { id: 'projectPhotos', get label() { return t("client.chat.projectPhotos"); }, icon: Image }, { id: 'plugins', get label() { return t("client.chat.plugins"); }, icon: Box },
] as const;

export function ComposerAddMenu({ busy, choose }: { busy: boolean; choose: (action: ComposerAddAction) => void }) {
  useLanguage();
  return <div className="chat-add-menu" role="menu" aria-label={t("client.chat.addContent")}>
    {ADD_ACTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="menuitem"
      disabled={busy} onClick={() => choose(id)}><Icon size={20} /><span>{label}</span></button>)}
  </div>;
}

interface CommandProps {
  input: RefObject<HTMLTextAreaElement>;
  catalog: SkillCatalogState; query: string; skillsOnly: boolean; compactReason: string | null;
  choose: (skill: Skill) => void; compact: () => void; goal: () => void; close: () => void;
  plugins?: PluginChoices;
}
export function ChatCommandMenu({ catalog, query, skillsOnly, compactReason, choose, compact, goal,
  close, input, plugins }: CommandProps) {
  const language = useLanguage();
  const surfaceTheme = useChatSurfaceTheme();
  const search = query.toLocaleLowerCase();
  const pluginCatalog = usePluginCatalog(skillsOnly ? undefined : plugins?.load);
  const choices = pluginOptions(pluginCatalog.result, search, plugins?.choose);
  const skills = catalog.skills.filter(skill =>
    `${skill.name} ${skillLabel(skill)} ${skillDescription(skill, language)}`.toLocaleLowerCase().includes(search));
  const showCompact = !skillsOnly && t("client.chat.compactContext").includes(search);
  const showGoal = !skillsOnly && t("client.chat.goalKeepWorking").includes(search);
  const options: ComposerMenuOption[] = [
    ...(showCompact ? [{ key: 'compact', enabled: compactReason === null, choose: compact }] : []),
    ...(showGoal ? [{ key: 'goal', enabled: true, choose: goal }] : []),
    ...choices,
    ...skills.map(skill => ({ key: skill.path, enabled: skill.enabled, choose: () => choose(skill) })),
  ];
  const keyboard = useComposerMenuKeyboard({ input, query, options, close });
  const commands = t('client.chat.commandsAndSkills');
  const title = choices.length ? `${commands} · ${t('client.chat.plugins')}` : commands;
  return <div className="chat-command-menu" style={surfaceTheme} aria-label={title}>
    <header><strong>{title}</strong>
      <button type="button" aria-label={t("client.chat.closeCommandsAndSkills")} onClick={close}>
      <X size={16} /></button></header>
    <div ref={keyboard.list} id={keyboard.id} className="chat-menu-options" role="menu">
      {showCompact && <button type="button" role="menuitem" aria-label={t("client.chat.compactContext.d36946")}
        {...keyboard.optionProps('compact')}
        disabled={compactReason !== null} onClick={compact}><strong>{t("client.chat.compact")} <small>/compact</small></strong>
        <small>{compactReason ? displayText(compactReason) : t("client.chat.compactThisConversationSContext")}</small></button>}
      {showGoal && <button type="button" role="menuitem" aria-label={t("client.chat.goalMode")} onClick={goal}
        {...keyboard.optionProps('goal')}>
        <strong>{t("client.chat.goal")} <small>/goal</small></strong><small>{t("client.chat.keepWorkingUntilTheGoalIsComplete")}</small></button>}
      {choices.map(option => <PluginOption key={option.key} option={option} {...keyboard.optionProps(option.key)} />)}
      {skills.map(skill => <FocusPreservingButton key={skill.path} role="menuitem" {...keyboard.optionProps(skill.path)}
        aria-label={t("client.chat.useSkill", { value1: skillLabel(skill) })}
        disabled={!skill.enabled} onClick={() => choose(skill)}>
        <strong>{skillLabel(skill)}{!skill.enabled && t("client.chat.disabled")}</strong>
        <small>{skillDescription(skill, language)}</small></FocusPreservingButton>)}
      {catalog.loading && !catalog.loaded && <p role="status">{t("client.chat.loadingSkills")}</p>}
      {catalog.error && <p role="status">{displayError(catalog.error)}</p>}
      {pluginCatalog.loading && <p role="status">{t("client.chat.loadingPlugins")}</p>}
      {pluginCatalog.error && <p role="status">{displayError(pluginCatalog.error)}</p>}
      {catalog.loaded && !options.length && !pluginCatalog.loading
        && <p>{t("client.chat.noMatchingCommandsOrSkills")}</p>}
    </div>
  </div>;
}

interface PluginChoices {
  load: () => Promise<RemoteComposerCatalog>;
  choose: (plugin: ComposerPlugin) => void;
}

function usePluginCatalog(load?: PluginChoices['load']) {
  const [read, setRead] = useState<{ load: PluginChoices['load']; result?: RemoteComposerCatalog }>();
  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    void load().then(result => { if (!cancelled) setRead({ load, result }); })
      .catch(() => { if (!cancelled) setRead({ load }); });
    return () => { cancelled = true; };
  }, [load]);
  const response = load && read?.load === load ? read : undefined;
  return { result: response?.result, loading: !!load && !response,
    error: response && !response.result ? t('client.chat.couldNotUpdatePluginsYouCanStillChooseExistingItems')
      : response?.result?.pluginsError || '' };
}

function pluginOptions(result: RemoteComposerCatalog | undefined, search: string, choose?: PluginChoices['choose']) {
  if (!choose) return [];
  return (result?.plugins ?? []).filter(plugin => plugin.installed && plugin.enabled).flatMap(plugin => {
    const label = plugin.interface?.displayName || plugin.name;
    const description = plugin.interface?.shortDescription;
    return `${label} ${plugin.name}`.toLocaleLowerCase().includes(search)
      ? [{ key: `plugin:${plugin.id}`, label, description, enabled: true, choose: () => choose(plugin) }]
      : [];
  });
}

function PluginOption({ option, ...attributes }: Pick<ButtonHTMLAttributes<HTMLButtonElement>,
  'id' | 'tabIndex' | 'aria-current'> & {
  option: ReturnType<typeof pluginOptions>[number];
}) {
  return <FocusPreservingButton role="menuitem" {...attributes}
    aria-label={t("client.chat.use.e0049a", { value1: t("client.chat.plugins"), value2: option.label })}
    onClick={option.choose}>
    <strong className="chat-row"><Box size={16} aria-hidden="true" />{option.label}</strong>
    {option.description && <small>{option.description}</small>}
  </FocusPreservingButton>;
}

export function ComposerPluginMenu({ catalog, query, load, chooseSkill, choosePlugin, input, close }: {
  input: RefObject<HTMLTextAreaElement>; close: () => void;
  catalog: SkillCatalogState; query: string; load: () => Promise<RemoteComposerCatalog>;
  chooseSkill: (skill: Skill) => void; choosePlugin: (plugin: ComposerPlugin) => void;
}) {
  useLanguage();
  const { result, loading, error } = usePluginCatalog(load);
  const plugins = pluginOptions(result, query.toLocaleLowerCase(), choosePlugin);
  const skills = result?.data.flatMap(group => group.skills) ?? catalog.skills;
  const options = skills.filter(skill => skill.enabled
    && `${skillLabel(skill)} ${skill.name}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const skillOptions = options.map(skill => ({ key: skill.path, enabled: true, choose: () => chooseSkill(skill) }));
  const keyboard = useComposerMenuKeyboard({ input, query, close,
    options: [...plugins, ...skillOptions] });
  return <div className="chat-command-menu" aria-label={t("client.chat.pluginList")}><header><strong>{t("client.chat.plugins")}</strong></header>
    <div ref={keyboard.list} id={keyboard.id} className="chat-menu-options" role="menu">
      {plugins.map(option => <PluginOption key={option.key} option={option} {...keyboard.optionProps(option.key)} />)}
      {options.map(skill => <FocusPreservingButton role="menuitem" {...keyboard.optionProps(skill.path)} key={skill.path}
        aria-label={t("client.chat.use.e0049a", { value1: t("client.chat.skills"), value2: skillLabel(skill) })}
        onClick={() => chooseSkill(skill)}>
        <span className="chat-row"><Box size={20} />{skillLabel(skill)}</span></FocusPreservingButton>)}
      {loading && !plugins.length && !options.length && <p role="status">{t("client.chat.loadingPlugins")}</p>}
      {!loading && !plugins.length && !options.length && !error
        && <p>{query ? t("client.chat.noMatchingPlugins") : t("client.chat.noPluginsOrSkillsAvailable")}</p>}
      {error && <p role="status">{displayError(error)}</p>}
    </div></div>;
}
