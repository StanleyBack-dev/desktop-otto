import type {
  AccountResult,
  AccountSettings,
  NewsSource,
  Place,
  SettingsChange,
  SuggestedNewsSource,
} from "@shared/account";

// The owner's account settings through the preload bridge.
export const accountClient = {
  settings: (): Promise<AccountResult<AccountSettings>> =>
    window.otto.account.settings(),
  updateSettings: (
    change: SettingsChange,
  ): Promise<AccountResult<AccountSettings>> =>
    window.otto.account.updateSettings(change),
  updateName: (name: string): Promise<AccountResult<string>> =>
    window.otto.account.updateName(name),
  searchPlaces: (name: string): Promise<AccountResult<Place[]>> =>
    window.otto.account.searchPlaces(name),
  setLocation: (place: Place): Promise<AccountResult<AccountSettings>> =>
    window.otto.account.setLocation(place),
  newsSources: (): Promise<AccountResult<NewsSource[]>> =>
    window.otto.account.newsSources(),
  suggestedNewsSources: (): Promise<AccountResult<SuggestedNewsSource[]>> =>
    window.otto.account.suggestedNewsSources(),
  addNewsSource: (source: {
    url: string;
    category: string;
  }): Promise<AccountResult<NewsSource>> =>
    window.otto.account.addNewsSource(source),
  updateNewsSource: (change: {
    id: string;
    active?: boolean;
  }): Promise<AccountResult<NewsSource>> =>
    window.otto.account.updateNewsSource(change),
  removeNewsSource: (id: string): Promise<AccountResult<boolean>> =>
    window.otto.account.removeNewsSource(id),
};
