import {
  placeLabel,
  type AccountResult,
  type AccountSettings,
  type NewsSource,
  type Place,
  type SettingsChange,
  type SuggestedNewsSource,
} from "@shared/account";
import { ApiError } from "../api/graphql-client";
import type { SessionService } from "../session/session.service";

const SETTINGS_FIELDS = `assistantName language timeZone speechRate autoSpeak
  wakeWordEnabled briefingEnabled briefingTime
  location { name latitude longitude }`;
const SOURCE_FIELDS = `id name url category active lastError`;

const Q = {
  settings: `query AccountSettings { mySettings { ${SETTINGS_FIELDS} } }`,
  updateSettings: `mutation UpdateSettings($input: UpdateSettingsInput!) { updateMySettings(input: $input) { ${SETTINGS_FIELDS} } }`,
  updateLocation: `mutation UpdateLocation($input: UpdateLocationInput!) { updateMyLocation(input: $input) { ${SETTINGS_FIELDS} } }`,
  updateProfile: `mutation UpdateProfile($input: UpdateProfileInput!) { updateMyProfile(input: $input) { name email } }`,
  searchPlaces: `query SearchPlaces($name: String!) { searchPlaces(name: $name) { name region latitude longitude timeZone } }`,
  sources: `query NewsSources { newsSources { ${SOURCE_FIELDS} } }`,
  suggested: `query SuggestedSources { suggestedNewsSources { name url category } }`,
  addSource: `mutation AddSource($input: AddNewsSourceInput!) { addNewsSource(input: $input) { ${SOURCE_FIELDS} } }`,
  updateSource: `mutation UpdateSource($input: UpdateNewsSourceInput!) { updateNewsSource(input: $input) { ${SOURCE_FIELDS} } }`,
  removeSource: `mutation RemoveSource($id: ID!) { removeNewsSource(id: $id) }`,
};

// The owner's account settings through the signed-in session. Each call
// returns the API message on failure, ready to show in Ajustes.
export class AccountService {
  constructor(private readonly session: SessionService) {}

  settings(): Promise<AccountResult<AccountSettings>> {
    return this.run<{ mySettings: AccountSettings }, AccountSettings>(
      Q.settings,
      {},
      (d) => d.mySettings,
    );
  }

  updateSettings(
    change: SettingsChange,
  ): Promise<AccountResult<AccountSettings>> {
    return this.run<{ updateMySettings: AccountSettings }, AccountSettings>(
      Q.updateSettings,
      { input: change },
      (d) => d.updateMySettings,
    );
  }

  /** Saves a city found by name (and follows its time zone). */
  setLocation(place: Place): Promise<AccountResult<AccountSettings>> {
    return this.run<{ updateMyLocation: AccountSettings }, AccountSettings>(
      Q.updateLocation,
      {
        input: {
          latitude: place.latitude,
          longitude: place.longitude,
          name: placeLabel(place).slice(0, 120),
          ...(place.timeZone ? { timeZone: place.timeZone } : {}),
        },
      },
      (d) => d.updateMyLocation,
    );
  }

  async updateName(name: string): Promise<AccountResult<string>> {
    const result = await this.run<
      { updateMyProfile: { name: string; email: string } },
      { name: string; email: string }
    >(Q.updateProfile, { input: { name } }, (d) => d.updateMyProfile);
    if (!result.ok) return result;
    this.session.updateUser(result.data);
    return { ok: true, data: result.data.name };
  }

  searchPlaces(name: string): Promise<AccountResult<Place[]>> {
    return this.run<{ searchPlaces: Place[] }, Place[]>(
      Q.searchPlaces,
      { name },
      (d) => d.searchPlaces,
    );
  }

  newsSources(): Promise<AccountResult<NewsSource[]>> {
    return this.run<{ newsSources: NewsSource[] }, NewsSource[]>(
      Q.sources,
      {},
      (d) => d.newsSources,
    );
  }

  suggestedNewsSources(): Promise<AccountResult<SuggestedNewsSource[]>> {
    return this.run<
      { suggestedNewsSources: SuggestedNewsSource[] },
      SuggestedNewsSource[]
    >(Q.suggested, {}, (d) => d.suggestedNewsSources);
  }

  addNewsSource(source: {
    url: string;
    category: string;
  }): Promise<AccountResult<NewsSource>> {
    return this.run<{ addNewsSource: NewsSource }, NewsSource>(
      Q.addSource,
      { input: source },
      (d) => d.addNewsSource,
    );
  }

  updateNewsSource(change: {
    id: string;
    active?: boolean;
    category?: string;
  }): Promise<AccountResult<NewsSource>> {
    return this.run<{ updateNewsSource: NewsSource }, NewsSource>(
      Q.updateSource,
      { input: change },
      (d) => d.updateNewsSource,
    );
  }

  removeNewsSource(id: string): Promise<AccountResult<boolean>> {
    return this.run<{ removeNewsSource: boolean }, boolean>(
      Q.removeSource,
      { id },
      (d) => d.removeNewsSource,
    );
  }

  private async run<D, T>(
    query: string,
    variables: Record<string, unknown>,
    pick: (data: D) => T,
  ): Promise<AccountResult<T>> {
    try {
      return {
        ok: true,
        data: pick(await this.session.call<D>(query, variables)),
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof ApiError
            ? error.toFailure()
            : {
                code: "UNKNOWN",
                message: "Não consegui salvar agora. Tente de novo.",
              },
      };
    }
  }
}
