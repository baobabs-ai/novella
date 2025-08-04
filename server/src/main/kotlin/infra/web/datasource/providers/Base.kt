package infra.web.datasource.providers

import infra.common.Page
import infra.web.WebNovelAttention
import infra.web.WebNovelAuthor
import infra.web.WebNovelType
import io.ktor.client.call.*
import io.ktor.client.statement.*
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.toKotlinInstant
import kotlinx.serialization.json.*
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.atomic.AtomicLong

data class RemoteNovelMetadata(
    val title: String,
    val authors: List<WebNovelAuthor>,
    val type: WebNovelType,
    val attentions: List<WebNovelAttention>,
    val keywords: List<String>,
    val points: Int?,
    val totalCharacters: Int,
    val introduction: String,
    val toc: List<TocItem>,
) {
    data class TocItem(
        val title: String,
        val chapterId: String? = null,
        val createAt: Instant? = null,
    )
}

data class RemoteChapter(
    val paragraphs: List<String>,
)

data class RemoteNovelListItem(
    val novelId: String,
    val title: String,
    val attentions: List<WebNovelAttention>,
    val keywords: List<String>,
    val extra: String,
)

interface WebNovelProvider {
    suspend fun getRank(options: Map<String, String>): Page<RemoteNovelListItem>
    suspend fun getMetadata(novelId: String): RemoteNovelMetadata
    suspend fun getChapter(novelId: String, chapterId: String): RemoteChapter
}

suspend fun HttpResponse.document(): Document = Jsoup.parse(body<String>())
suspend fun HttpResponse.json(): JsonObject = body()

// Datetime util
fun parseJapanDateString(pattern: String, dateString: String): Instant =
    SimpleDateFormat(pattern)
        .apply { timeZone = TimeZone.getTimeZone("Asia/Tokyo") }
        .parse(dateString)
        .toInstant()
        .toKotlinInstant()

// Json util
fun JsonObject.boolean(field: String) = get(field)!!.jsonPrimitive.boolean
fun JsonObject.int(field: String) = get(field)!!.jsonPrimitive.int
fun JsonObject.array(field: String) = get(field)!!.jsonArray

fun JsonObject.string(field: String) = get(field)!!.jsonPrimitive.content
fun JsonObject.stringOrNull(field: String) = get(field)!!.jsonPrimitive.contentOrNull

fun JsonObject.obj(field: String) = get(field)!!.jsonObject
fun JsonObject.objOrNull(field: String) = get(field)!!.takeUnless { it is JsonNull }?.jsonObject

// Exception
open class WebNovelProviderException(msg: String) : Exception(msg)

class NovelIdShouldBeReplacedException(
    providerId: String,
    targetNovelId: String,
) : WebNovelProviderException("Novel ID is not suitable, should use: /${providerId}/${targetNovelId}")

class NovelRateLimitedException
      : WebNovelProviderException("Source site request frequency too high")

class NovelAccessDeniedException
      : WebNovelProviderException("Current account cannot access this novel resource")
